import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderCommand } from "../src/commands/render";
import fs from "node:fs/promises";
import { readStdin } from "../src/utils.js";
import * as coreWrapper from "@wenyan-md/core/wrapper";

// 1. Mock 外部模块
vi.mock("node:fs/promises");
vi.mock("../src/utils.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/utils.js")>();

    return {
        ...actual,
        readStdin: vi.fn(),
    };
});

describe("renderCommand", () => {
    // 定义 Spy 对象
    let consoleLogSpy: any;
    let consoleErrorSpy: any;
    let processExitSpy: any;

    beforeEach(() => {
        // 2. 每次测试前重置状态
        vi.clearAllMocks();

        // 拦截 console 和 process.exit，防止测试输出混乱或进程退出
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        // 关键：阻止 process.exit 真的退出进程
        processExitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
            throw new Error(`Process exit with code ${code}`);
        });
    });

    afterEach(() => {
        // 恢复所有 Spy
        vi.restoreAllMocks();
    });

    it("should render content from direct string argument", async () => {
        const input = "# Hello";
        const options = { theme: "default" };

        await renderCommand(input, options as any);

        // 验证：输出了结果
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("<span>Hello</span></h1>"));
        // 验证：没有报错退出
        expect(processExitSpy).not.toHaveBeenCalled();
    });

    it("should render content from stdin when input arg is missing", async () => {
        // 模拟非 TTY 环境 (即有管道输入)
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = false;

        vi.mocked(readStdin).mockResolvedValue("# From Stdin");

        await renderCommand(undefined, {} as any);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("<span>From Stdin</span></h1>"));

        // 恢复环境
        process.stdin.isTTY = originalIsTTY;
    });

    it("should render content from file when input arg and stdin are missing", async () => {
        // 模拟 TTY 环境 (无管道输入)
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = true;

        const fileContent = "# From File";
        vi.mocked(fs.readFile).mockResolvedValue(fileContent);

        await renderCommand(undefined, { file: "test.md" } as any);

        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/test.md`, "utf-8");
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("<span>From File</span></h1>"));

        process.stdin.isTTY = originalIsTTY;
    });

    it("should exit(1) when no input source is provided", async () => {
        const originalIsTTY = process.stdin.isTTY;
        process.stdin.isTTY = true; // 无管道输入

        // 这里因为 mock 了 process.exit 抛错，所以用 expect(...).rejects
        await expect(renderCommand(undefined, {} as any)).rejects.toThrow("Process exit with code 1");

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("missing input-content"));

        process.stdin.isTTY = originalIsTTY;
    });

    it("should load custom theme css if option provided", async () => {
        const input = "# Content";
        const cssContent = "#wenyan { color: red; }";

        // 模拟读取 CSS 文件
        vi.mocked(fs.readFile).mockResolvedValue(cssContent);

        await renderCommand(input, { customTheme: "my-theme.css" } as any);

        expect(fs.readFile).toHaveBeenCalledWith(`${process.cwd()}/my-theme.css`, "utf-8");
        // 验证传入 core 的 options 包含了 themeCss
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("color: red"));
    });

});
