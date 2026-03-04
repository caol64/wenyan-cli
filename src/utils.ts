import path from "node:path";
import fs from "node:fs/promises";
import { getNormalizeFilePath } from "@wenyan-md/core/wrapper";

export async function readStdin(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => (data += chunk));
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", reject);
    });
}

export async function getInputContent(
    inputContent?: string,
    file?: string,
): Promise<{ content: string; absoluteDirPath: string | undefined }> {
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
        throw new Error("missing input-content (no argument, no stdin, and no file).");
    }

    return { content: inputContent, absoluteDirPath };
}
