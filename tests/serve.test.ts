import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { serveCommand, UPLOAD_DIR } from "../src/commands/serve.js";

describe("serve.ts", () => {
    const testPort = 3999; // 使用非常用端口避免冲突
    const testApiKey = "test-api-key-123";
    let serverProcess: Promise<void>;
    let baseUrl: string;

    afterEach(async () => {
        // 清理：发送 SIGTERM 关闭服务器
        process.emit("SIGTERM" as any);

        // 等待服务器关闭
        try {
            await Promise.race([
                serverProcess,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Server close timeout")), 2000)),
            ]);
        } catch (error: any) {
            // 忽略超时错误
        }

        mock.restoreAll();

        process.removeAllListeners("SIGTERM");
        process.removeAllListeners("SIGINT");

        // 等待一小段时间确保端口释放
        await new Promise((resolve) => setTimeout(resolve, 100));
    });

    async function makeRequest(
        method: string,
        endpoint: string,
        options: { headers?: Record<string, string>; body?: any } = {},
    ): Promise<{ statusCode: number | undefined; body: any }> {
        const url = new URL(endpoint, baseUrl).toString();

        // 构造 fetch 参数
        const fetchOptions: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        };

        // 处理 body
        if (options.body !== undefined) {
            if (typeof options.body === "string") {
                fetchOptions.body = options.body;
            } else {
                fetchOptions.body = JSON.stringify(options.body);
            }
        }

        return fetch(url, fetchOptions).then(async (res) => {
            const statusCode = res.status;
            try {
                // 尝试解析 JSON
                const body = await res.json();
                return { statusCode, body };
            } catch {
                // 解析失败返回原始文本
                const body = await res.text();
                return { statusCode, body };
            }
        });
    }

    describe("Health Check", () => {
        it("should return health status", async () => {
            // 启动服务器（mock 控制台输出）
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort, version: "1.0.0" });
            baseUrl = `http://localhost:${testPort}`;

            // 等待服务器启动
            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode, body } = await makeRequest("GET", "/health");

            assert.equal(statusCode, 200);
            assert.equal(body.status, "ok");
            assert.equal(body.service, "wenyan-cli");
            assert.equal(body.version, "1.0.0");
        });
    });

    describe("Authentication", () => {
        it("should allow access without API key when not configured", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode } = await makeRequest("GET", "/verify");

            assert.equal(statusCode, 200);
        });

        it("should reject access without API key when configured", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort, apiKey: testApiKey });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode, body } = await makeRequest("GET", "/verify");

            assert.equal(statusCode, 401);
            assert.equal(body.code, -1);
            assert.ok(body.desc.includes("Unauthorized"));
        });

        it("should allow access with valid API key", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort, apiKey: testApiKey });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode, body } = await makeRequest("GET", "/verify", {
                headers: { "x-api-key": testApiKey },
            });

            assert.equal(statusCode, 200);
            assert.equal(body.success, true);
        });
    });

    describe("Upload Endpoint", () => {
        it("should reject upload without file", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            // 使用 multipart/form-data 上传空文件
            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2);
            // 构造一个残缺的 form 报文，用来模拟错误上传
            const bodyStr = `--${boundary}\r\nContent-Disposition: form-data; name="wrong_field"\r\n\r\nNo File\r\n--${boundary}--\r\n`;

            const { statusCode, body: responseBody } = await makeRequest("POST", "/upload", {
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${boundary}`,
                    "Content-Length": Buffer.byteLength(bodyStr).toString(),
                },
                body: bodyStr,
            });

            // 验证它被正确拒绝了 (400)
            assert.equal(statusCode, 400);
            assert.ok(responseBody.desc.includes("未找到上传的文件") || responseBody.desc.includes("Unexpected"));
        });

        it("should upload a valid markdown file and verify it exists on disk", async () => {
            mock.method(console, "log", mock.fn());
            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;
            await new Promise((r) => setTimeout(r, 200));

            const boundary = "----testboundary";
            const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.md"\r\nContent-Type: text/markdown\r\n\r\n# hello\r\n\r\n--${boundary}--\r\n`;

            const { statusCode, body: resBody } = await makeRequest("POST", "/upload", {
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${boundary}`,
                },
                body,
            });

            // 1. 接口返回校验
            assert.equal(statusCode, 200);
            assert.ok(resBody.success);
            assert.ok(resBody.data.fileId);

            // 2. ✅ 核心：去磁盘真实校验文件是否存在
            const uploadedFile = path.join(UPLOAD_DIR, resBody.data.fileId);
            const exists = await fs
                .access(uploadedFile)
                .then(() => true)
                .catch(() => false);
            assert.ok(exists, "上传的文件应该真实存在于磁盘上");

            // 3. ✅ 测试完主动删除，不留临时文件
            await fs.unlink(uploadedFile).catch(() => {});
        });

        it("should reject unsupported file type", async () => {
            mock.method(console, "log", mock.fn());
            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;
            await new Promise((r) => setTimeout(r, 200));

            const boundary = "----testboundary";
            const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.exe"\r\nContent-Type: application/octet-stream\r\n\r\nxxx\r\n--${boundary}--\r\n`;

            const { statusCode, body: resBody } = await makeRequest("POST", "/upload", {
                headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
                body,
            });

            assert.equal(statusCode, 400);
            assert.ok(resBody.desc.includes("不支持的文件类型"));
        });
    });

    describe("Publish Endpoint", () => {
        it("should forward comment options from uploaded json to publishToWechatDraft", async () => {
            mock.method(console, "log", mock.fn());

            const previousAppId = process.env.WECHAT_APP_ID;
            const previousAppSecret = process.env.WECHAT_APP_SECRET;
            process.env.WECHAT_APP_ID = "test-app-id";
            process.env.WECHAT_APP_SECRET = "test-app-secret";

            try {
                const publishModule = await import("@wenyan-md/core/publish");
                mock.method(publishModule.WechatPublisher.prototype, "getAccessTokenWithCache", async () => "mock-access-token");
                mock.method(
                    publishModule.WechatPublisher.prototype,
                    "uploadImage",
                    async () => ({
                        media_id: "mock-upload-media-id",
                        url: "https://mmbiz.qpic.cn/mock-uploaded-image",
                    }),
                );
                const publishDraftMock = mock.method(
                    publishModule.WechatPublisher.prototype,
                    "publishToDraft",
                    async () => ({ media_id: "mock-media-id-123" }),
                );

                serverProcess = serveCommand({ port: testPort });
                baseUrl = `http://localhost:${testPort}`;
                await new Promise((resolve) => setTimeout(resolve, 200));

                const imageBoundary = "----testimageupload";
                const imageBody = [
                    `--${imageBoundary}`,
                    `Content-Disposition: form-data; name="file"; filename="cover.png"`,
                    `Content-Type: image/png`,
                    "",
                    "fake-image-content",
                    `--${imageBoundary}--`,
                ].join("\r\n");

                const imageUploadRes = await makeRequest("POST", "/upload", {
                    headers: {
                        "Content-Type": `multipart/form-data; boundary=${imageBoundary}`,
                    },
                    body: imageBody,
                });

                assert.equal(imageUploadRes.statusCode, 200);
                const imageFileId = imageUploadRes.body.data.fileId;

                const articleJson = JSON.stringify({
                    title: "测试文章",
                    content: `<p>测试内容</p><img src="asset://${imageFileId}" />`,
                    author: "测试作者",
                    source_url: "https://example.com",
                    need_open_comment: 1,
                    only_fans_can_comment: 1,
                });

                const articleBoundary = "----testarticleupload";
                const articleBody = [
                    `--${articleBoundary}`,
                    `Content-Disposition: form-data; name="file"; filename="article.json"`,
                    `Content-Type: application/json`,
                    "",
                    articleJson,
                    `--${articleBoundary}--`,
                ].join("\r\n");

                const uploadRes = await makeRequest("POST", "/upload", {
                    headers: {
                        "Content-Type": `multipart/form-data; boundary=${articleBoundary}`,
                    },
                    body: articleBody,
                });

                assert.equal(uploadRes.statusCode, 200);
                const fileId = uploadRes.body.data.fileId;

                const publishRes = await makeRequest("POST", "/publish", {
                    body: { fileId, appId: "test-app-id" },
                });

                assert.equal(publishRes.statusCode, 200);
                assert.equal(publishRes.body.media_id, "mock-media-id-123");
                assert.equal(publishDraftMock.mock.callCount(), 1);

                const publishOptions = publishDraftMock.mock.calls[0].arguments[1];
                assert.ok(publishOptions);
                assert.equal(publishOptions.need_open_comment, 1);
                assert.equal(publishOptions.only_fans_can_comment, 1);
            } finally {
                if (previousAppId === undefined) {
                    delete process.env.WECHAT_APP_ID;
                } else {
                    process.env.WECHAT_APP_ID = previousAppId;
                }

                if (previousAppSecret === undefined) {
                    delete process.env.WECHAT_APP_SECRET;
                } else {
                    process.env.WECHAT_APP_SECRET = previousAppSecret;
                }
            }
        });

        it("should reject publish without fileId", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode, body } = await makeRequest("POST", "/publish", {
                body: { theme: "default" },
            });

            assert.equal(statusCode, 400);
            assert.ok(body.desc.includes("fileId"));
        });

        it("should reject publish with non-existent fileId", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode, body } = await makeRequest("POST", "/publish", {
                body: { fileId: "non-existent-id" },
            });

            assert.equal(statusCode, 400);
            assert.ok(body.desc.includes("文件不存在") || body.desc.includes("non-existent-id"));
        });
    });

    describe("Error Handler", () => {
        it("should handle AppError with 400 status", async () => {
            mock.method(console, "log", mock.fn());

            serverProcess = serveCommand({ port: testPort });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            const { statusCode, body } = await makeRequest("POST", "/publish", {
                body: {},
            });

            assert.equal(statusCode, 400);
            assert.equal(body.code, -1);
        });
    });

    describe("API Key Protection", () => {
        it("should reject /upload without api key", async () => {
            mock.method(console, "log", mock.fn());
            serverProcess = serveCommand({ port: testPort, apiKey: testApiKey });
            baseUrl = `http://localhost:${testPort}`;
            await new Promise((r) => setTimeout(r, 200));

            const { statusCode } = await makeRequest("POST", "/upload");
            assert.equal(statusCode, 401);
        });

        it("should reject /publish without api key", async () => {
            mock.method(console, "log", mock.fn());
            serverProcess = serveCommand({ port: testPort, apiKey: testApiKey });
            baseUrl = `http://localhost:${testPort}`;
            await new Promise((r) => setTimeout(r, 200));

            const { statusCode } = await makeRequest("POST", "/publish");
            assert.equal(statusCode, 401);
        });
    });

    describe("Server Startup", () => {
        it("should start server on specified port", async () => {
            const consoleLogMock = mock.fn();
            mock.method(console, "log", consoleLogMock);

            serverProcess = serveCommand({ port: testPort, version: "1.0.0" });
            baseUrl = `http://localhost:${testPort}`;

            await new Promise((resolve) => setTimeout(resolve, 200));

            // 验证服务器启动消息被输出
            assert.ok(
                consoleLogMock.mock.calls.some((call) => {
                    const args = call.arguments;
                    return args.some((arg: any) => typeof arg === "string" && arg.includes("文颜 Server 已启动"));
                }),
            );
        });

        it("should reject when port is in use", async () => {
            mock.method(console, "log", mock.fn());
            mock.method(console, "error", mock.fn());

            // 先启动一个服务器占用端口
            const firstServer = serveCommand({ port: testPort });
            await new Promise((resolve) => setTimeout(resolve, 200));

            // 尝试启动第二个服务器
            try {
                const secondServer = serveCommand({ port: testPort });
                await Promise.race([
                    secondServer,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000)),
                ]);
            } catch (error: any) {
                assert.ok(error.message.includes("已被占用") || error.message.includes("EADDRINUSE"));
            }

            // 关闭第一个服务器
            process.emit("SIGTERM" as any);
            await new Promise((resolve) => setTimeout(resolve, 100));
        });
    });
});
