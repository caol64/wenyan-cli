import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import { getInputContent, readStdin } from "../src/utils.js";
import { PassThrough } from "node:stream";
import os from "node:os";

describe("utils.ts", () => {
    describe("readStdin", () => {
        const originalStdin = process.stdin;
        afterEach(() => {
            mock.restoreAll();
            Object.defineProperty(process, "stdin", { value: originalStdin, configurable: true });
        });

        it("should correctly buffer and return data from stdin", async () => {
            const mockStdin = new PassThrough();
            Object.defineProperty(process, "stdin", { value: mockStdin, configurable: true });
            const promise = readStdin();
            mockStdin.write("Hello ");
            mockStdin.write("正文!");
            mockStdin.end();
            const result = await promise;
            assert.equal(result, "Hello 正文!");
        });

        it("should reject when stdin emits an error", async () => {
            const mockStdin = new PassThrough();
            Object.defineProperty(process, "stdin", { value: mockStdin, configurable: true });
            const readPromise = readStdin();
            const testError = new Error("Stdin reading failed");
            mockStdin.emit("error", testError);
            await assert.rejects(readPromise, testError);
        });
    });

    describe("getInputContent", () => {
        const tempDir = os.tmpdir();
        const testContent = "# Test Markdown";
        const testFilePath = path.join(tempDir, "test-input.md");
        const originalStdin = process.stdin;

        afterEach(async () => {
            mock.restoreAll();
            Object.defineProperty(process, "stdin", { value: originalStdin, configurable: true });
            (process.stdin as any).isTTY = true;
            // 清理可能遗留的临时文件
            await fs.unlink(testFilePath).catch(() => {});
        });

        it("should throw error when no input provided", async () => {
            (process.stdin as any).isTTY = true;
            const promise = getInputContent(undefined, undefined);
            const testError = new Error("missing input-content (no argument, no stdin, and no file).");
            await assert.rejects(promise, testError);
        });

        it("should return content from inputContent argument", async () => {
            (process.stdin as any).isTTY = true; // TTY 模式
            const result = await getInputContent(testContent, undefined);

            assert.equal(result.content, testContent);
            assert.equal(result.absoluteDirPath, undefined);

            (process.stdin as any).isTTY = false; // 管道模式
            const result2 = await getInputContent(testContent, undefined);

            assert.equal(result2.content, testContent);
            assert.equal(result2.absoluteDirPath, undefined);
        });

        it("should read content from file", async () => {
            await fs.writeFile(testFilePath, testContent, "utf-8");

            (process.stdin as any).isTTY = true; // TTY 模式
            const result = await getInputContent(undefined, testFilePath);

            assert.equal(result.content, testContent);
            assert.equal(result.absoluteDirPath, path.dirname(testFilePath));

            (process.stdin as any).isTTY = false; // 管道模式
            const result2 = await getInputContent(undefined, testFilePath);

            assert.equal(result2.content, testContent);
            assert.equal(result2.absoluteDirPath, path.dirname(testFilePath));
        });

        it("should prioritize inputContent over file", async () => {
            const fileContent = "File content";
            await fs.writeFile(testFilePath, fileContent, "utf-8");

            const result = await getInputContent(testContent, testFilePath);

            assert.equal(result.content, testContent);
            assert.equal(result.absoluteDirPath, undefined);
        });

        it("should prioritize file over stdin when both are available", async () => {
            const mockStdin = new PassThrough();
            (mockStdin as any).isTTY = false;
            Object.defineProperty(process, "stdin", { value: mockStdin, configurable: true });

            const fileContent = "File content";
            await fs.writeFile(testFilePath, fileContent, "utf-8");

            const promise = getInputContent(undefined, testFilePath);
            mockStdin.write("Content from stdin");
            mockStdin.end();
            const result = await promise;

            assert.equal(result.content, fileContent);
            assert.equal(result.absoluteDirPath, path.dirname(testFilePath));
        });

        it("should read from stdin", async () => {
            const mockStdin = new PassThrough();
            (mockStdin as any).isTTY = false;
            Object.defineProperty(process, "stdin", { value: mockStdin, configurable: true });

            const promise = getInputContent(undefined, undefined);
            mockStdin.write("Content from stdin");
            mockStdin.end();
            const result = await promise;

            assert.equal(result.content, "Content from stdin");
            assert.equal(result.absoluteDirPath, undefined);
        });

        it("should throw error when file does not exist", async () => {
            const promise = getInputContent(undefined, "/nonexistent/file.md");
            const testError = new Error("ENOENT: no such file or directory, open '/nonexistent/file.md'") as any;
            testError.code = "ENOENT";
            await assert.rejects(promise, testError);
        });
    });
});
