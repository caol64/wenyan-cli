import path from "node:path";
import fs from "node:fs/promises";
import { getNormalizeFilePath } from "@wenyan-md/core/wrapper";

export function readStdin(timeoutMs = 100): Promise<string | null> {
    return new Promise((resolve) => {
        let data = "";
        let resolved = false;
        const stream = process.stdin;

        stream.setEncoding?.("utf8");

        const onData = (chunk: string) => (data += chunk);
        const onEnd = () => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(data || null);
            }
        };
        const onError = () => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(null);
            }
        };

        // 超时处理：如果在指定时间内没有收到 end 事件，认为没有输入
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(null);
            }
        }, timeoutMs);

        const cleanup = () => {
            clearTimeout(timeout);
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

    // 1. 尝试从 Stdin 读取（带超时保护）
    if (!inputContent && !process.stdin.isTTY) {
        const stdinContent = await readStdin(100);
        if (stdinContent) {
            inputContent = stdinContent;
        }
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
