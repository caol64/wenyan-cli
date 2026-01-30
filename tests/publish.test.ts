import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { publishCommand } from "../src/commands/publish";
import { publishToDraft } from "@wenyan-md/core/publish";
import { join } from "node:path";
import { readFileSync } from "node:fs";

// 1. Mock 外部模块
vi.mock("node:fs/promises");
vi.mock("../src/utils.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/utils.js")>();

    return {
        ...actual,
        readStdin: vi.fn(),
    };
});
vi.mock("@wenyan-md/core/publish");

const md = readFileSync(join(process.cwd(), "tests/publish.md"), "utf8");

describe("publishCommand", () => {
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

    it("should handle unexpected errors and exit(1)", async () => {
        const error = new Error("Render Failed");
        vi.mocked(publishToDraft).mockRejectedValue(error);

        await expect(publishCommand(md, {} as any)).rejects.toThrow("Process exit with code 1");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("An unexpected error occurred:"),
            expect.anything(),
        );
    });
});
