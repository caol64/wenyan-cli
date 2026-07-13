import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveApiKey } from "../src/api-key.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true })));
});

describe("API Key 文件", () => {
    it("should return a directly configured API key", async () => {
        assert.equal(await resolveApiKey({ apiKey: "direct-key" }), "direct-key");
    });

    it("should read and trim an API key file", async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wenyan-api-key-"));
        temporaryDirectories.push(directory);
        const apiKeyFile = path.join(directory, "api-key");
        await fs.writeFile(apiKeyFile, "  file-key\n", { mode: 0o600 });

        assert.equal(await resolveApiKey({ apiKeyFile }), "file-key");
    });

    it("should reject an empty API key file", async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wenyan-empty-api-key-"));
        temporaryDirectories.push(directory);
        const apiKeyFile = path.join(directory, "api-key");
        await fs.writeFile(apiKeyFile, " \n\t", { mode: 0o600 });

        await assert.rejects(resolveApiKey({ apiKeyFile }), /API Key 文件 .+ 为空/);
    });

    it("should reject conflicting API key options", async () => {
        await assert.rejects(
            resolveApiKey({ apiKey: "direct-key", apiKeyFile: "/run/secrets/api-key" }),
            /--api-key 和 --api-key-file 不能同时使用/,
        );
    });
});
