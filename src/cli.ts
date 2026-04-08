#!/usr/bin/env node
import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import {
    addTheme,
    ClientPublishOptions,
    listThemes,
    prepareRenderContext,
    removeTheme,
    renderAndPublish,
    renderAndPublishToServer,
    RenderOptions,
    ThemeOptions,
    configDir,
    credentialStore,
} from "@wenyan-md/core/wrapper";
import { getInputContent } from "./utils.js";
import path from "node:path";
import input from "@inquirer/input";
import password from "@inquirer/password";

export function createProgram(version: string = pkg.version): Command {
    const program = new Command();

    program
        .name("wenyan")
        .description("CLI for WenYan - A Markdown render and publisher tool.")
        .version(version, "-v, --version", "output the current version")
        .action(() => {
            program.outputHelp();
        });

    const addCommonOptions = (cmd: Command) => {
        return cmd
            .argument("[input-content]", "markdown content (string input)")
            .option("-f, --file <path>", "read markdown content from local file or web URL")
            .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
            .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
            .option("-c, --custom-theme <path>", "path to custom theme CSS file")
            .option("--mac-style", "display codeblock with mac style", true)
            .option("--no-mac-style", "disable mac style")
            .option("--footnote", "convert link to footnote", true)
            .option("--no-footnote", "disable footnote");
    };

    const pubCmd = program
        .command("publish")
        .description("Render a markdown file to styled HTML and publish to wechat MP platform");

    // 先添加公共选项，再追加 publish 专属选项
    addCommonOptions(pubCmd)
        .option("--app-id <appId>", "AppID for the WeChat MP platform")
        .option("--server <url>", "Server URL to publish through (e.g. https://api.yourdomain.com)")
        .option("--api-key <apiKey>", "API key for the remote server")
        .action(async (inputContent: string | undefined, options: ClientPublishOptions) => {
            await runCommandWrapper(async () => {
                // 如果传入了 --server，则走客户端（远程）模式
                if (options.server) {
                    options.clientVersion = version; // 将 CLI 版本传递给服务器，便于调试和兼容性处理
                    const mediaId = await renderAndPublishToServer(inputContent, options, getInputContent);
                    console.log(`发布成功，Media ID: ${mediaId}`);
                } else {
                    // 走原有的本地直接发布模式
                    const mediaId = await renderAndPublish(inputContent, options, getInputContent);
                    console.log(`发布成功，Media ID: ${mediaId}`);
                }
            });
        });

    const renderCmd = program.command("render").description("Render a markdown file to styled HTML");

    addCommonOptions(renderCmd).action(async (inputContent: string | undefined, options: RenderOptions) => {
        await runCommandWrapper(async () => {
            const { gzhContent } = await prepareRenderContext(inputContent, options, getInputContent);
            console.log(gzhContent.content);
        });
    });

    program
        .command("theme")
        .description("Manage themes")
        .option("-l, --list", "List all available themes")
        .option("--add", "Add a new custom theme")
        .option("--name <name>", "Name of the new custom theme")
        .option("--path <path>", "Path to the new custom theme CSS file")
        .option("--rm <name>", "Name of the custom theme to remove")
        .action(async (options: ThemeOptions) => {
            if (Object.keys(options).length === 0) {
                program.commands.find((c) => c.name() === "theme")?.outputHelp();
                return;
            }
            await runCommandWrapper(async () => {
                const { list, add, name, path, rm } = options;
                if (list) {
                    const themes = await listThemes();
                    console.log("内置主题：");
                    themes
                        .filter((theme) => theme.isBuiltin)
                        .forEach((theme) => {
                            console.log(`- ${theme.id}: ${theme.description ?? ""}`);
                        });
                    const customThemes = themes.filter((theme) => !theme.isBuiltin);
                    if (customThemes.length > 0) {
                        console.log("\n自定义主题：");
                        customThemes.forEach((theme) => {
                            console.log(`- ${theme.id}: ${theme.description ?? ""}`);
                        });
                    }
                    return;
                }
                if (add) {
                    await addTheme(name, path);
                    console.log(`主题 "${name}" 已添加`);
                    return;
                }
                if (rm) {
                    await removeTheme(rm);
                    console.log(`主题 "${rm}" 已删除`);
                }
            });
        });

    program
        .command("serve")
        .description("Start a server to provide HTTP API for rendering and publishing")
        .option("-p, --port <port>", "Port to listen on (default: 3000)", "3000")
        .option("--api-key <apiKey>", "API key for authentication")
        .action(async (options: { port?: string; apiKey?: string }) => {
            try {
                const { serveCommand } = await import("./commands/serve.js");
                const port = options.port ? parseInt(options.port, 10) : 3000;
                await serveCommand({ port, version, apiKey: options.apiKey });
            } catch (error: any) {
                console.error(error.message);
                process.exit(1);
            }
        });

    program
        .command("credential")
        .description("Manage wechat credentials (e.g. AppID and AppSecret)")
        .option("-l, --location", "Get the storage location of configuration credentials")
        .option("-s, --set", "Interactively set the wechat credentials (AppID & AppSecret)")
        .action(async (options: { location?: boolean; set?: boolean }) => {
            if (Object.keys(options).length === 0) {
                program.commands.find((c) => c.name() === "credential")?.outputHelp();
                return;
            }
            await runCommandWrapper(async () => {
                if (options.location) {
                    console.log(path.join(configDir, "credential.json"));
                    return;
                }
                if (options.set) {
                    console.log("请输入微信公众号的开发者凭据：");
                    const appId = await input({
                        message: "AppID:",
                        validate: (value) => value.trim().length > 0 || "AppID 不能为空",
                    });

                    const appSecret = await password({
                        message: "AppSecret:",
                        mask: true,
                        validate: (value) => value.trim().length > 0 || "AppSecret 不能为空",
                    });

                    await credentialStore.saveWechatCredential(appId.trim(), appSecret.trim());
                    console.log("微信凭据已安全保存！");
                }
            });
        });

    return program;
}

// --- 统一的错误处理包装器 ---
async function runCommandWrapper(action: () => Promise<void>) {
    try {
        await action();
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("An unexpected error occurred:", error);
        }
        process.exit(1);
    }
}

export const program = createProgram();

// 仅在作为主模块运行时执行 parse，防止测试文件 import 时意外触发
if (import.meta.main) {
    program.parse(process.argv);
}
