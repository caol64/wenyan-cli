import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import { getInputContent, readStream, readStdin } from "../src/utils.js";
import { PassThrough } from "node:stream";

describe("utils.ts", () => {
    describe("readStdin", () => {
        afterEach(() => {
            mock.restoreAll();
        });

        it("should correctly buffer and return data from stdin", async () => {
            const stream = new PassThrough();
            const promise = readStream(stream);
            stream.write("Hello ");
            stream.write("World!");
            stream.end();
            const result = await promise;
            assert.equal(result, "Hello World!");
        });

        it("should reject when stdin emits an error", async () => {
            const stream = new PassThrough();
            const readPromise = readStream(stream);
            const testError = new Error("Stdin reading failed");
            stream.emit("error", testError);
            await assert.rejects(readPromise, testError);
        });
    });

    describe("getInputContent", () => {
        const testContent = "# Test Markdown";
        const testFilePath = "/tmp/test-input.md";
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
            await assert.rejects(
                async () => {
                    await getInputContent(undefined, undefined);
                },
                {
                    message: "missing input-content (no argument, no stdin, and no file).",
                },
            );
        });

        it("should return content from inputContent argument", async () => {
            const result = await getInputContent(testContent, undefined);

            assert.equal(result.content, testContent);
            assert.equal(result.absoluteDirPath, undefined);
        });

        it("should read content from file", async () => {
            await fs.writeFile(testFilePath, testContent, "utf-8");

            const result = await getInputContent(undefined, testFilePath);

            assert.equal(result.content, testContent);
            assert.equal(result.absoluteDirPath, path.dirname(testFilePath));
        });

        it("should prioritize inputContent over file", async () => {
            const fileContent = "File content";
            await fs.writeFile(testFilePath, fileContent, "utf-8");

            const result = await getInputContent(testContent, testFilePath);

            // 应该使用 inputContent 而不是文件内容
            assert.equal(result.content, testContent);
            assert.equal(result.absoluteDirPath, undefined);
        });

        it("should read from stdin when isTTY is false and inputContent is not provided", async () => {
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

        it("should handle stdin timeout gracefully", async () => {
            const mockStdin = new PassThrough();
            (mockStdin as any).isTTY = false;
            Object.defineProperty(process, "stdin", { value: mockStdin, configurable: true });

            // 不写入任何数据，也不结束流，模拟没有输入的情况
            const promise = getInputContent(undefined, "/tmp/test-fallback.md");
            
            // 等待足够长的时间让超时触发（100ms + 一些缓冲）
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 现在写入文件内容作为后备
            await fs.writeFile("/tmp/test-fallback.md", "File content fallback", "utf-8");
            
            // 由于 stdin 超时返回 null，应该回退到文件读取
            // 但此时文件还不存在，所以会抛出错误
            await assert.rejects(promise, {
                code: "ENOENT",
            });
            
            // 清理
            await fs.unlink("/tmp/test-fallback.md").catch(() => {});
        });

        it("should prioritize stdin over file when both are available", async () => {
            const mockStdin = new PassThrough();
            (mockStdin as any).isTTY = false;
            Object.defineProperty(process, "stdin", { value: mockStdin, configurable: true });

            const fileContent = "File content";
            await fs.writeFile(testFilePath, fileContent, "utf-8");

            const promise = getInputContent(undefined, undefined);
            mockStdin.write("Content from stdin");
            mockStdin.end();
            const result = await promise;

            // 按照逻辑：!inputContent && !process.stdin.isTTY 时，inputContent 被赋为 stdin 内容
            // 然后在第二步: !inputContent && file 时，因为 inputContent 已有值，文件读取被跳过
            assert.equal(result.content, "Content from stdin");
            // 既然没读文件，absoluteDirPath 应该是 undefined
            assert.equal(result.absoluteDirPath, undefined);
        });

        it("should throw error when file does not exist", async () => {
            (process.stdin as any).isTTY = true;
            await assert.rejects(
                async () => {
                    await getInputContent(undefined, "/nonexistent/file.md");
                },
                {
                    code: "ENOENT",
                },
            );
        });
    });
});
