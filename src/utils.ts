import path from "node:path";
import fs from "node:fs/promises";
import { getNormalizeFilePath } from "@wenyan-md/core/wrapper";

export function readStdin(): Promise<string> {
    process.stdin.setEncoding("utf8"); // windows中文版可能有问题
    return readStream(process.stdin);
}

async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
    }
    return chunks.join("");
}

export async function getInputContent(
    inputContent?: string,
    file?: string,
): Promise<{ content: string; absoluteDirPath: string | undefined }> {
    // 优先级 1：直接传入的内存数据（最高优先级，直接返回）
    if (inputContent) {
        return { content: inputContent, absoluteDirPath: undefined };
    }

    // 优先级 2：用户指定了文件
    if (file) {
        const normalizePath = getNormalizeFilePath(file);
        const content = await fs.readFile(normalizePath, "utf-8");
        return { content, absoluteDirPath: path.dirname(normalizePath) };
    }

    // 优先级 3：管道方式，尝试读取标准输入流
    if (!process.stdin.isTTY) {
        // 注意，如果 stdin 没有数据，可能会导致程序挂起，不做处理，参考 cat 命令不带任何参数时的行为
        const content = await readStdin();
        if (content) {
            return { content, absoluteDirPath: undefined };
        }
    }

    throw new Error("missing input-content (no argument, no stdin, and no file).");
}
