import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { serveCommand } from "../src/commands/serve.js";

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

        // 等待一小段时间确保端口释放
        await new Promise((resolve) => setTimeout(resolve, 100));
    });

    function makeRequest(
        method: string,
        endpoint: string,
        options: { headers?: Record<string, string>; body?: any } = {},
    ): Promise<{ statusCode: number | undefined; body: any }> {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, baseUrl);
            const requestOptions: http.RequestOptions = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            };

            const req = http.request(url, requestOptions, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const body = JSON.parse(data);
                        resolve({ statusCode: res.statusCode, body });
                    } catch (error) {
                        resolve({ statusCode: res.statusCode, body: data });
                    }
                });
            });

            req.on("error", reject);

            if (options.body) {
                if (typeof options.body === "string") {
                    req.write(options.body);
                } else {
                    req.write(JSON.stringify(options.body));
                }
            }

            req.end();
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
                    "Content-Length": Buffer.byteLength(bodyStr).toString()
                },
                body: bodyStr,
            });

            // 验证它被正确拒绝了 (400)
            assert.equal(statusCode, 400);
            assert.ok(responseBody.desc.includes("未找到上传的文件") || responseBody.desc.includes("Unexpected"));
        });
    });

    describe("Publish Endpoint", () => {
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
