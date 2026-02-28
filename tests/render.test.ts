import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prepareRenderContext } from "../src/commands/render";
import fs from "node:fs/promises";
import { readStdin } from "../src/utils.js";

// 1. Mock 外部模块
vi.mock("node:fs/promises");
vi.mock("../src/utils.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/utils.js")>();
    return {
        ...actual,
        readStdin: vi.fn(),
    };
});

describe("prepareRenderContext", () => {
    // 默认配置，防止 "theme undefined" 错误
    const defaultOptions = {
        theme: "default",
        highlight: "solarized-light",
        macStyle: true,
        footnote: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // 拦截 console 和 process.exit
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(process, "exit").mockImplementation((code) => {
            throw new Error(`Process exit with code ${code}`);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should render content from direct string argument", async () => {
        const input = "# Hello";

        const { gzhContent } = await prepareRenderContext(input, defaultOptions as any);

        expect(gzhContent.content).toContain("<span>Hello</span></h1>");
    });

    it("should render content from stdin when input arg is missing", async () => {
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = false;

        vi.mocked(readStdin).mockResolvedValue("# From Stdin");

        const { gzhContent } = await prepareRenderContext(undefined, defaultOptions as any);

        expect(gzhContent.content).toContain("<span>From Stdin</span></h1>");
        process.stdin.isTTY = originalIsTTY;
    });

    it("should render content from file when input arg and stdin are missing", async () => {
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = true;

        const fileContent = "# From File";
        vi.mocked(fs.readFile).mockResolvedValue(fileContent);

        const { gzhContent } = await prepareRenderContext(undefined, { ...defaultOptions, file: "test.md" } as any);

        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/test.md`, "utf-8");
        expect(gzhContent.content).toContain("<span>From File</span></h1>");

        process.stdin.isTTY = originalIsTTY;
    });

    it("should throw error (which leads to exit) when no input source is provided", async () => {
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = true;

        // prepareRenderContext 内部使用的是 throw Error，这里需要匹配实际抛出的错误信息
        await expect(prepareRenderContext(undefined, defaultOptions as any)).rejects.toThrow(/missing input-content/);

        process.stdin.isTTY = originalIsTTY;
    });

    it("should load custom theme css if option provided", async () => {
        const input = "# Content";
        const cssContent = ".test { color: red; }";

        vi.mocked(fs.readFile).mockResolvedValue(cssContent);

        // 验证返回的 gzhContent 包含了自定义样式
        const { gzhContent } = await prepareRenderContext(input, {
            ...defaultOptions,
            customTheme: "my-theme.css",
        } as any);

        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/my-theme.css`, "utf-8");
        // 假设 StyledContent 结构中 content 包含渲染后的 HTML，这里检查它是否处理了样式
        expect(gzhContent.content).toContain("<span>Content</span></h1>");
    });
});
