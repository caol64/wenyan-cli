import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createProgram } from "../src/cli.js";

describe("CLI Argument Parsing", () => {
    let program: ReturnType<typeof createProgram>;

    beforeEach(async () => {
        mock.restoreAll();
        program = createProgram("1.0.0");
        // 关键：防止 commander 在测试失败或调用 help 时直接退出进程
        program.exitOverride();
        // 重写 outputHelp 以避免输出
        mock.method(program, "outputHelp", mock.fn());
    });

    afterEach(() => {
        mock.restoreAll();
    });

    it("should verify version flag", () => {
        assert.equal(program.version(), "1.0.0");
    });

    it("should have publish command", () => {
        const commands = program.commands.map((cmd) => cmd.name());
        assert.ok(commands.includes("publish"));
    });

    it("should have render command", () => {
        const commands = program.commands.map((cmd) => cmd.name());
        assert.ok(commands.includes("render"));
    });

    it("should have theme command", () => {
        const commands = program.commands.map((cmd) => cmd.name());
        assert.ok(commands.includes("theme"));
    });

    it("should have serve command", () => {
        const commands = program.commands.map((cmd) => cmd.name());
        assert.ok(commands.includes("serve"));
    });

    it("should display help when no command is provided", async () => {
        const args = ["node", "wenyan"];

        // 不应该抛出异常
        await program.parseAsync(args);
    });

    it("should parse theme list command", async () => {
        const consoleLogMock = mock.fn();
        mock.method(console, "log", consoleLogMock);

        const args = ["node", "wenyan", "theme", "--list"];

        await program.parseAsync(args);

        // 验证输出了主题列表
        const hasOutput = consoleLogMock.mock.calls.some((call) => {
            const args = call.arguments;
            return args.some((arg: any) => typeof arg === "string" && arg.includes("内置主题"));
        });
        assert.ok(hasOutput);
    });
});
