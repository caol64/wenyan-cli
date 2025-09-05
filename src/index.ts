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
    .argument("[input-content]", "content of the input markdown file")
    .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
    .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
    .option("-m, --mac-style", "display codeblock with mac style", true)
    .action(publishCommand);

program
    .command("render")
    .description("Render a markdown file to styled HTML")
    .argument("[input-content]", "content of the input markdown file")
    .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
    .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
    .option("-m, --mac-style", "display codeblock with mac style", true)
    .action(renderCommand);

program.parse();
