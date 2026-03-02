import path from "node:path";
import { AppError, RenderOptions } from "./types.js";
import fs from "node:fs/promises";

export async function readStdin(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => (data += chunk));
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", reject);
    });
}

/**
 * 路径标准化工具函数
 * 将 Windows 的反斜杠 \ 转换为正斜杠 /，并去除末尾斜杠
 * 目的：在 Linux 容器内也能正确处理 Windows 路径字符串
 */
function normalizePath(p: string): string {
    return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function getNormalizeFilePath(inputPath: string): string {
    const isContainer = !!process.env.CONTAINERIZED;
    const hostFilePath = normalizePath(process.env.HOST_FILE_PATH || "");
    if (isContainer && hostFilePath) {
        const containerFilePath = normalizePath(process.env.CONTAINER_FILE_PATH || "/mnt/host-downloads");
        let relativePart = normalizePath(inputPath);
        if (relativePart.startsWith(hostFilePath)) {
            relativePart = relativePart.slice(hostFilePath.length);
        }

        if (!relativePart.startsWith("/")) {
            relativePart = "/" + relativePart;
        }
        return containerFilePath + relativePart;
    } else {
        return path.resolve(inputPath);
    }
}

export async function getInputContent(
    inputContent: string | undefined,
    options: RenderOptions,
): Promise<{ content: string; absoluteDirPath: string | undefined }> {
    const { file } = options;
    let absoluteDirPath: string | undefined = undefined;

    // 1. 尝试从 Stdin 读取
    if (!inputContent && !process.stdin.isTTY) {
        inputContent = await readStdin();
    }

    // 2. 尝试从文件读取
    if (!inputContent && file) {
        const normalizePath = getNormalizeFilePath(file);
        inputContent = await fs.readFile(normalizePath, "utf-8");
        absoluteDirPath = path.dirname(normalizePath);
    }

    // 3. 校验输入
    if (!inputContent) {
        throw new AppError("missing input-content (no argument, no stdin, and no file).");
    }

    return { content: inputContent, absoluteDirPath };
}
