import { Command } from "commander";
import { publishCommand } from "./commands/publish.js";
import { renderCommand } from "./commands/render.js";
import pkg from "../package.json" with { type: "json" };

const program = new Command();

program
    .name("wenyan")
    .description("A CLI for WenYan Markdown Render.")
    .version(pkg.version, "-v, --version", "output the current version")
    .action(() => {
        program.outputHelp();
        return;
    });


program
    .command("publish")
    .description("Render a markdown file to styled HTML and publish to wechat GZH")
    .argument("[input-content]", "markdown content (string input)")
    .option("-f, --file <path>", "read markdown content from local file")
    .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
    .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
    .option("--mac-style", "display codeblock with mac style", true)
    .option("--no-mac-style", "disable mac style")
    .option("--footnote", "convert link to footnote", true)
    .option("--no-footnote", "disable footnote")
    .action(publishCommand);

program
    .command("render")
    .description("Render a markdown file to styled HTML")
    .argument("[input-content]", "markdown content (string input)")
    .option("-f, --file <path>", "read markdown content from local file")
    .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
    .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
    .option("--mac-style", "display codeblock with mac style", true)
    .option("--no-mac-style", "disable mac style")
    .option("--footnote", "convert link to footnote", true)
    .option("--no-footnote", "disable footnote")
    .action(renderCommand);

program.parse();
