import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { publishCommand } from "../src/commands/publish";
import { publishToWechatDraft } from "@wenyan-md/core/publish";
import { prepareRenderContext } from "../src/commands/render";
import { join } from "node:path";
import { readFileSync } from "node:fs";

// 1. Mock 依赖模块
vi.mock("@wenyan-md/core/publish");
vi.mock("../src/commands/render"); // 关键：Mock 内部的 render 准备逻辑

const md = readFileSync(join(process.cwd(), "tests/publish.md"), "utf8");

describe("publishCommand", () => {
    const defaultOptions = { theme: "default" };

    beforeEach(() => {
        vi.clearAllMocks();
        // 默认拦截 console，保持测试输出整洁
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should successfully publish and return mediaId", async () => {
        // 2. 模拟 prepareRenderContext 返回完整的文章信息
        vi.mocked(prepareRenderContext).mockResolvedValue({
            gzhContent: {
                title: "测试标题",
                content: "<h1>内容</h1>",
                cover: "http://cover.jpg",
                author: "作者",
                source_url: "http://source.com"
            } as any,
            absoluteDirPath: "/mock/path"
        });

        // 3. 模拟底层微信发布接口返回 media_id
        vi.mocked(publishToWechatDraft).mockResolvedValue({
            media_id: "mock_media_123"
        } as any);

        const result = await publishCommand(md, defaultOptions as any);

        // 4. 验证返回值
        expect(result).toBe("mock_media_123");
        expect(publishToWechatDraft).toHaveBeenCalledWith(
            expect.objectContaining({ title: "测试标题" }),
            { relativePath: "/mock/path" }
        );
    });

    it("should throw error if title is missing", async () => {
        vi.mocked(prepareRenderContext).mockResolvedValue({
            gzhContent: { title: "", content: "..." } as any, // 缺失标题
            absoluteDirPath: undefined
        });

        await expect(publishCommand(md, defaultOptions as any))
            .rejects.toThrow("Error: 未能找到文章标题");
    });

    it("should throw error if cover is missing", async () => {
        vi.mocked(prepareRenderContext).mockResolvedValue({
            gzhContent: { title: "有标题", cover: "" } as any, // 缺失封面
            absoluteDirPath: undefined
        });

        await expect(publishCommand(md, defaultOptions as any))
            .rejects.toThrow("Error: 未能找到文章封面");
    });

    it("should throw error when WeChat API fails to return media_id", async () => {
        vi.mocked(prepareRenderContext).mockResolvedValue({
            gzhContent: { title: "标题", cover: "封面" } as any,
            absoluteDirPath: undefined
        });

        // 模拟 API 返回了错误对象（没有 media_id）
        const apiError = "Invalid Token";
        vi.mocked(publishToWechatDraft).mockResolvedValue(apiError as any);

        await expect(publishCommand(md, defaultOptions as any))
            .rejects.toThrow(/Error: 上传失败/);
    });
});
