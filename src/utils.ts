import path from "node:path";
import fs from "node:fs/promises";
import { getNormalizeFilePath } from "@wenyan-md/core/wrapper";

export function readStdin(): Promise<string> {
    return readStream(process.stdin);
}

export async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = "";

        stream.setEncoding?.("utf8");

        const onData = (chunk: string) => (data += chunk);
        const onEnd = () => {
            cleanup();
            resolve(data);
        };
        const onError = (err: Error) => {
            cleanup();
            reject(err);
        };

        const cleanup = () => {
            stream.removeListener("data", onData);
            stream.removeListener("end", onEnd);
            stream.removeListener("error", onError);
        };

        stream.on("data", onData);
        stream.on("end", onEnd);
        stream.on("error", onError);

        stream.resume?.();
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
