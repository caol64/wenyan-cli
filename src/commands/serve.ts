import express, { Request, Response } from "express";
import { publishCommand } from "./publish.js";
import { prepareRenderContext } from "./render.js";
import { RenderOptions } from "../types.js";

export interface ServeOptions {
    port?: number;
}

interface RenderRequest {
    content?: string;
    file?: string;
    theme?: string;
    highlight?: string;
    customTheme?: string;
    macStyle?: boolean;
    footnote?: boolean;
}

interface PublishRequest extends RenderRequest {
    title?: string;
    cover?: string;
    author?: string;
    source_url?: string;
}

function validateRequest(req: RenderRequest): void {
    if (!req.content && !req.file) {
        throw new Error("缺少必要参数：content 或 file");
    }
}

/**
 * 将 API 请求参数转换为 RenderOptions
 */
function toRenderOptions(body: RenderRequest): RenderOptions {
    return {
        file: body.file,
        theme: body.theme || "default",
        customTheme: body.customTheme,
        highlight: body.highlight || "solarized-light",
        macStyle: body.macStyle !== false,
        footnote: body.footnote !== false,
    };
}

export async function serveCommand(options: ServeOptions) {
    const app = express();
    const port = options.port || 3000;

    app.use(express.json({ limit: "10mb" }));

    // 健康检查
    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok", service: "wenyan-cli", version: process.env.npm_package_version || "unknown" });
    });

    // 渲染接口 - 直接调用 render.ts 中的 prepareRenderContext
    app.post("/render", async (req: Request, res: Response) => {
        try {
            const body: RenderRequest = req.body;
            validateRequest(body);

            const renderOptions = toRenderOptions(body);
            const { gzhContent } = await prepareRenderContext(body.content, renderOptions);

            res.json({
                success: true,
                data: {
                    html: gzhContent.content,
                },
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || "渲染失败",
            });
        }
    });

    // 发布接口 - 直接调用 publish.ts 中的 publishCommand
    app.post("/publish", async (req: Request, res: Response) => {
        try {
            const body: PublishRequest = req.body;
            validateRequest(body);

            const renderOptions = toRenderOptions(body);
            let inputContent = body.content || "";

            const media_id = await publishCommand(inputContent, renderOptions);

            res.json({
                success: true,
                data: {
                    media_id: media_id,
                },
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || "发布失败",
            });
        }
    });

    return new Promise<void>((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`文颜 Server 已启动，监听端口 ${port}`);
            console.log(`健康检查：http://localhost:${port}/health`);
            console.log(`渲染接口：POST http://localhost:${port}/render`);
            console.log(`发布接口：POST http://localhost:${port}/publish`);
        });

        server.on("error", (err: any) => {
            if (err.code === "EADDRINUSE") {
                console.error(`端口 ${port} 已被占用`);
                reject(new Error(`端口 ${port} 已被占用`));
            } else {
                reject(err);
            }
        });

        process.on("SIGINT", () => {
            console.log("\n正在关闭服务器...");
            server.close(() => {
                console.log("服务器已关闭");
                resolve();
            });
        });

        process.on("SIGTERM", () => {
            server.close(() => {
                resolve();
            });
        });
    });
}
