import fs from "node:fs/promises";

export interface ApiKeyOptions {
    apiKey?: string;
    apiKeyFile?: string;
}

export async function resolveApiKey(options: ApiKeyOptions): Promise<string | undefined> {
    if (options.apiKey !== undefined && options.apiKeyFile !== undefined) {
        throw new Error("--api-key 和 --api-key-file 不能同时使用");
    }

    if (options.apiKeyFile === undefined) {
        return options.apiKey;
    }

    let apiKey: string;
    try {
        apiKey = await fs.readFile(options.apiKeyFile, "utf8");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`无法读取 API Key 文件 '${options.apiKeyFile}': ${message}`, { cause: error });
    }

    apiKey = apiKey.trim();
    if (!apiKey) {
        throw new Error(`API Key 文件 '${options.apiKeyFile}' 为空`);
    }

    return apiKey;
}
