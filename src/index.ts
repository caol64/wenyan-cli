import { Command } from "commander";
import { publishCommand } from "./commands/publish.js";
import { prepareRenderContext } from "./commands/render.js";
import { serveCommand } from "./commands/serve.js";
import pkg from "../package.json" with { type: "json" };
import { themeCommand } from "./commands/theme.js";
import { RenderOptions } from "./types.js";

export function createProgram(version: string = pkg.version): Command {
    const program = new Command();

    program
        .name("wenyan")
        .description("A CLI for WenYan Markdown Render.")
        .version(version, "-v, --version", "output the current version")
        .action(() => {
            program.outputHelp();
        });

    const addCommonOptions = (cmd: Command) => {
        return cmd
            .argument("[input-content]", "markdown content (string input)")
            .option("-f, --file <path>", "read markdown content from local file")
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
        .description("Render a markdown file to styled HTML and publish to wechat GZH");

    addCommonOptions(pubCmd).action(async (inputContent: string | undefined, options: RenderOptions) => {
        await runCommandWrapper(async () => {
            const mediaId = await publishCommand(inputContent, options);
            console.log(mediaId);
        });
    });

    const renderCmd = program.command("render").description("Render a markdown file to styled HTML");

    addCommonOptions(renderCmd).action(async (inputContent: string | undefined, options: RenderOptions) => {
        await runCommandWrapper(async () => {
            const { gzhContent } = await prepareRenderContext(inputContent, options);
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
        .action(themeCommand);

    program
        .command("serve")
        .description("Start a server to provide HTTP API for rendering and publishing")
        .option("-p, --port <port>", "Port to listen on (default: 3000)", "3000")
        .action(async (options: { port?: string }) => {
            try {
                await serveCommand({ port: options.port ? parseInt(options.port, 10) : 3000 });
            } catch (error: any) {
                console.error(error.message);
                process.exit(1);
            }
        });

    return program;
}

// --- 统一的错误处理包装器 ---
async function runCommandWrapper(action: () => Promise<void>) {
    try {
        await action();
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.startsWith("Error:")) {
                console.error(error.message);
            } else {
                console.error("An unexpected error occurred:", error.message);
            }
        } else {
            console.error("An unexpected error occurred:", error);
        }
        process.exit(1);
    }
}
