import express, { Request, Response, NextFunction } from "express";
import { publishCommand } from "./publish.js";
import { AppError, RenderOptions } from "../types.js";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { configDir } from "@wenyan-md/core/wrapper";
import multer from "multer";
import { getNormalizeFilePath } from "../utils.js";

export interface ServeOptions {
    port?: number;
    version?: string;
    apiKey?: string;
}

interface RenderRequest {
    fileId: string;
    theme?: string;
    highlight?: string;
    customTheme?: string;
    macStyle?: boolean;
    footnote?: boolean;
}

const UPLOAD_TTL_MS = 10 * 60 * 1000; // 10 minutes
const UPLOAD_DIR = path.join(configDir, "uploads");

export async function serveCommand(options: ServeOptions) {
    // 确保临时目录存在
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // 服务启动时立即执行一次后台清理
    cleanupOldUploads();
    // 定期清理过期的上传文件
    setInterval(cleanupOldUploads, UPLOAD_TTL_MS).unref();

    const app = express();
    const port = options.port || 3000;
    const auth = createAuthHandler(options);

    app.use(express.json({ limit: "10mb" }));

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            const fileId = crypto.randomUUID();
            const ext = file.originalname.split(".").pop() || "";
            cb(null, ext ? `${fileId}.${ext}` : fileId);
        },
    });

    const upload = multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
        fileFilter: (req, file, cb) => {
            const ext = file.originalname.split(".").pop()?.toLowerCase();
            const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
            const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "md"];

            const isImage =
                allowedImageTypes.includes(file.mimetype) || (ext && allowedExtensions.includes(ext) && ext !== "md");
            const isMarkdown = ext === "md" || file.mimetype === "text/markdown" || file.mimetype === "text/plain";

            if (isImage || isMarkdown) {
                cb(null, true);
            } else {
                cb(new AppError("不支持的文件类型，仅支持图片和 markdown 文件"));
            }
        },
    });

    // 健康检查
    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok", service: "wenyan-cli", version: options.version || "unknown" });
    });

    // 发布接口 - 读取 md 文件内容并发布
    app.post("/publish", auth, async (req: Request, res: Response) => {
        const body: RenderRequest = req.body;
        validateRequest(body);

        // 根据 fileId 去找刚上传的 markdown 文件并读取内容
        const files = await fsPromises.readdir(UPLOAD_DIR);
        const matchedFile = files.find((f) => f === body.fileId);

        if (!matchedFile) {
            throw new AppError(`文件不存在或已过期，请重新上传 (ID: ${body.fileId})`);
        }

        // 简单的防呆校验，防止直接提交纯图片的 fileId 到发布接口
        const ext = path.extname(matchedFile).toLowerCase();
        const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
        if (imageExts.includes(ext)) {
            throw new AppError("请提供 Markdown 文件的 fileId，不能直接发布图片文件");
        }

        const filePath = path.join(UPLOAD_DIR, matchedFile);

        // 提取文件真实文本内容
        let inputContent = await fsPromises.readFile(filePath, "utf-8");

        // 替换 asset://fileId 为图片绝对路径

        inputContent = inputContent.replace(/asset:\/\/([^\s)"']+)/g, (match, assetFileId) => {
            // 在刚才读取的 files 列表中寻找对应的图片文件
            const matchedAsset = files.find((f) => f === assetFileId);

            if (matchedAsset) {
                // 拼接绝对路径
                let absoluteAssetPath = getNormalizeFilePath(path.join(UPLOAD_DIR, matchedAsset));
                return absoluteAssetPath;
            }

            console.warn(`[Server Warning]: Referenced asset not found for fileId: ${assetFileId}`);
            return match; // 如果找不到对应的文件，保持原样不替换
        });

        const renderOptions = toRenderOptions(body);
        const media_id = await publishCommand(inputContent, renderOptions);

        res.json({
            media_id: media_id,
        });
    });

    // 上传接口
    app.post("/upload", auth, upload.single("file"), async (req: Request, res: Response) => {
        if (!req.file) {
            throw new AppError("未找到上传的文件");
        }

        const newFilename = req.file.filename;

        res.json({
            success: true,
            data: {
                fileId: newFilename,
                originalFilename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        });
    });

    app.use(errorHandler);

    return new Promise<void>((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`文颜 Server 已启动，监听端口 ${port}`);
            console.log(`健康检查：http://localhost:${port}/health`);
            console.log(`发布接口：POST http://localhost:${port}/publish`);
            console.log(`上传接口：POST http://localhost:${port}/upload`);
        });

        server.on("error", (err: any) => {
            if (err.code === "EADDRINUSE") {
                console.error(`端口 ${port} 已被占用`);
                reject(new Error(`端口 ${port} 已被占用`));
            } else {
                reject(err);
            }
        });

        process.on("SIGINT", () => {
            console.log("\n正在关闭服务器...");
            server.close(() => {
                console.log("服务器已关闭");
                resolve();
            });
        });

        process.on("SIGTERM", () => {
            server.close(() => resolve());
        });
    });
}

function errorHandler(error: any, _req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        return next(error);
    }

    const message = error instanceof Error ? error.message : String(error);

    // 修复：multer 抛出的文件限制错误（如超出大小），应判断为客户端 400 错误
    const isAppError = error instanceof AppError;
    const isMulterError = error.name === "MulterError";
    const statusCode = isAppError || isMulterError ? 400 : 500;

    if (statusCode === 500) {
        console.error("[Server Error]:", error);
    }

    res.status(statusCode).json({
        code: -1,
        desc: message,
    });
}

function createAuthHandler(config: { apiKey?: string }) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!config.apiKey) {
            return next();
        }

        const clientApiKey = req.headers["x-api-key"];
        if (clientApiKey === config.apiKey) {
            next();
        } else {
            res.status(401).json({
                code: -1,
                desc: "Unauthorized: Invalid API Key",
            });
        }
    };
}

function validateRequest(req: RenderRequest): void {
    if (!req.fileId) {
        throw new AppError("缺少必要参数：fileId");
    }
}

function toRenderOptions(body: RenderRequest): RenderOptions {
    return {
        theme: body.theme || "default",
        customTheme: body.customTheme,
        highlight: body.highlight || "solarized-light",
        macStyle: body.macStyle !== false,
        footnote: body.footnote !== false,
    };
}

async function cleanupOldUploads() {
    try {
        const files = await fsPromises.readdir(UPLOAD_DIR);
        const now = Date.now();
        for (const file of files) {
            const filePath = path.join(UPLOAD_DIR, file);
            try {
                const stats = await fsPromises.stat(filePath);
                if (now - stats.mtimeMs > UPLOAD_TTL_MS) {
                    await fsPromises.unlink(filePath);
                }
            } catch (e) {
                // 忽略单个文件处理错误
            }
        }
    } catch (e) {
        console.error("Cleanup task error:", e);
    }
}
