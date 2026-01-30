import { Command } from "commander";
import { publishCommand } from "./commands/publish.js";
import { renderCommand } from "./commands/render.js";
import pkg from "../package.json" with { type: "json" };
import { themeCommand } from "./commands/theme.js";

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

    addCommonOptions(pubCmd).action(publishCommand);

    const renderCmd = program.command("render").description("Render a markdown file to styled HTML");

    addCommonOptions(renderCmd).action(renderCommand);

    program
        .command("theme")
        .description("Manage themes")
        .option("-l, --list", "List all available themes")
        .option("--add", "Add a new custom theme")
        .option("--name <name>", "Name of the new custom theme")
        .option("--path <path>", "Path to the new custom theme CSS file")
        .option("--rm <name>", "Name of the custom theme to remove")
        .action(themeCommand);

    return program;
}
