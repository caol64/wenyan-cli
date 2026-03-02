import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { FormData, File } from "formdata-node";
import { FormDataEncoder } from "form-data-encoder";
import { AppError, PublishOptions } from "../types.js";
import { prepareRenderContext } from "./render.js";
import { JSDOM } from "jsdom";

export async function publishClient(inputContent: string | undefined, options: PublishOptions): Promise<string> {
    const { theme, customTheme, highlight, macStyle, footnote, apiKey, clientVersion, server } = options;
    const serverUrl = server!.replace(/\/$/, ""); // 移除末尾的斜杠

    const headers: Record<string, string> = {};

    if (clientVersion) {
        headers["x-client-version"] = clientVersion;
    }
    if (apiKey) {
        headers["x-api-key"] = apiKey;
    }

    // ==========================================
    // 0. 连通性与鉴权测试 (Health & Auth Check)
    // ==========================================
    console.log(`[Client] Checking server connection at ${serverUrl} ...`);

    try {
        // 1. 物理连通性与服务指纹验证
        const healthRes = await fetch(`${serverUrl}/health`, { method: "GET" });

        if (!healthRes.ok) {
            throw new Error(`HTTP Error: ${healthRes.status} ${healthRes.statusText}`);
        }

        const healthData: any = await healthRes.json();

        if (healthData.status !== "ok" || healthData.service !== "wenyan-cli") {
            throw new Error(`Invalid server response. Make sure the server URL is correct.`);
        }

        console.log(`[Client] Server connected successfully (version: ${healthData.version})`);

        // 2. 鉴权探针测试
        console.log(`[Client] Verifying authorization...`);
        const verifyRes = await fetch(`${serverUrl}/verify`, {
            method: "GET",
            headers, // 携带 x-api-key 和 x-client-version
        });

        if (verifyRes.status === 401) {
            throw new Error("鉴权失败 (401)：Server 拒绝访问，请检查传入的 --api-key 是否正确。");
        }

        if (!verifyRes.ok) {
            throw new Error(`Verify Error: ${verifyRes.status} ${verifyRes.statusText}`);
        }

        console.log(`[Client] Authorization passed.`);
    } catch (error: any) {
        if (error.message.includes("鉴权失败")) {
            throw error;
        }
        throw new Error(
            `Failed to connect to server (${serverUrl}). \nPlease check if the server is running and the network is accessible. \nDetails: ${error.message}`,
        );
    }

    // ==========================================
    // 1. 读取 markdown 文件，获取其所在目录（用于解析相对图片路径），并渲染成 HTML 格式
    // ==========================================
    const { gzhContent, absoluteDirPath } = await prepareRenderContext(inputContent, options);
    if (!gzhContent.title) throw new AppError("未能找到文章标题");
    if (!gzhContent.cover) throw new AppError("未能找到文章封面");

    // ==========================================
    // [内部辅助函数] 提取公共的本地图片上传逻辑
    // ==========================================
    const uploadLocalImage = async (originalUrl: string): Promise<string | null> => {
        let imagePath = originalUrl;
        if (!path.isAbsolute(imagePath)) {
            // 如果是相对路径，以 markdown 文件所在目录为基准进行拼接
            imagePath = path.resolve(absoluteDirPath || process.cwd(), imagePath);
        }

        if (!fs.existsSync(imagePath)) {
            console.warn(`[Client] Warning: Local image not found: ${imagePath}`);
            return null;
        }

        try {
            const fileBuffer = fs.readFileSync(imagePath);
            const filename = path.basename(imagePath);

            // 推断 Content-Type
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes: Record<string, string> = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".gif": "image/gif",
                ".webp": "image/webp",
                ".svg": "image/svg+xml",
            };
            const type = mimeTypes[ext] || "application/octet-stream";

            // 构建图片上传表单
            const form = new FormData();
            form.append("file", new File([fileBuffer], filename, { type }));
            const encoder = new FormDataEncoder(form);

            console.log(`[Client] Uploading local image: ${filename} ...`);

            const uploadRes = await fetch(`${serverUrl}/upload`, {
                method: "POST",
                headers: { ...headers, ...encoder.headers },
                body: Readable.from(encoder) as any,
                duplex: "half",
            } as RequestInit);

            if (uploadRes.status === 401) {
                throw new Error("鉴权失败 (401)：Server 拒绝访问，请检查传入的 --api-key 是否正确。");
            }

            const uploadData: any = await uploadRes.json();

            if (uploadRes.ok && uploadData.success) {
                // 返回可供 Server 直接使用的协议路径
                return `asset://${uploadData.data.fileId}`;
            } else {
                console.warn(`[Client] Warning: Failed to upload ${filename}: ${uploadData.error || uploadData.desc}`);
                return null;
            }
        } catch (error: any) {
            if (error.message.includes("鉴权失败") || error.message.includes("401")) {
                throw error;
            }
            console.warn(`[Client] Warning: Error uploading ${imagePath} - ${error.message}`);
            return null;
        }
    };

    // ==========================================
    // 2. 解析 HTML 中的所有本地图片上传并替换为服务器可访问的 URL
    // ==========================================
    let modifiedContent = gzhContent.content;
    if (modifiedContent.includes("<img")) {
        const dom = new JSDOM(modifiedContent);
        const document = dom.window.document;
        const images = Array.from(document.querySelectorAll("img"));

        // 并发上传所有插图
        const uploadPromises = images.map(async (element) => {
            const dataSrc = element.getAttribute("src");
            if (dataSrc && needUpload(dataSrc)) {
                const newUrl = await uploadLocalImage(dataSrc);
                if (newUrl) {
                    element.setAttribute("src", newUrl); // 替换 DOM 中的属性
                }
            }
        });

        await Promise.all(uploadPromises);

        modifiedContent = document.body.innerHTML;
        gzhContent.content = modifiedContent;
    }

    // ==========================================
    // 3. 处理封面图片
    // ==========================================
    const cover = gzhContent.cover;
    if (cover && needUpload(cover)) {
        console.log(`[Client] Processing cover image...`);
        const newCoverUrl = await uploadLocalImage(cover);
        if (newCoverUrl) {
            gzhContent.cover = newCoverUrl; // 将封面路径替换为 asset://fileId
        }
    }

    // ==========================================
    // 4. 将替换后的 content 保存成临时文件/流，并上传
    // ==========================================
    const mdFilename = "publish_target.json"; // 这个文件名对服务器来说没有实际意义，只是一个标识
    const mdForm = new FormData();
    mdForm.append(
        "file",
        new File([Buffer.from(JSON.stringify(gzhContent), "utf-8")], mdFilename, { type: "application/json" }),
    );

    const mdEncoder = new FormDataEncoder(mdForm);
    console.log(`[Client] Uploading compiled document ...`);

    const mdUploadRes = await fetch(`${serverUrl}/upload`, {
        method: "POST",
        headers: { ...headers, ...mdEncoder.headers },
        body: Readable.from(mdEncoder) as any,
        duplex: "half",
    } as RequestInit);

    if (mdUploadRes.status === 401) {
        throw new Error("鉴权失败 (401)：Server 拒绝访问，请检查传入的 --api-key 是否正确。");
    }

    const mdUploadData: any = await mdUploadRes.json();

    if (!mdUploadRes.ok || !mdUploadData.success) {
        throw new Error(`Upload Document Failed: ${mdUploadData.error || mdUploadData.desc || mdUploadRes.statusText}`);
    }

    const mdFileId = mdUploadData.data.fileId;
    console.log(`[Client] Document uploaded, ID: ${mdFileId}`);

    // ==========================================
    // 5. 调用 /publish 接口，触发 Server 端发布
    // ==========================================
    console.log(`[Client] Requesting remote Server to publish ...`);

    const publishRes = await fetch(`${serverUrl}/publish`, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fileId: mdFileId,
            theme,
            highlight,
            customTheme,
            macStyle,
            footnote,
        }),
    });

    if (publishRes.status === 401) {
        throw new Error("鉴权失败 (401)：Server 拒绝访问，请检查传入的 --api-key 是否正确。");
    }

    const publishData: any = await publishRes.json();

    if (!publishRes.ok || publishData.code === -1) {
        throw new Error(`Remote Publish Failed: ${publishData.desc || publishRes.statusText}`);
    }

    return publishData.media_id;
}

function needUpload(url: string): boolean {
    // 需要上传的图片链接通常是相对路径，且不以 http/https、data:、asset:// 等协议开头
    return !/^(https?:\/\/|data:|asset:\/\/)/i.test(url);
}
