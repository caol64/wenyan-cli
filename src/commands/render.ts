import { getGzhContent } from "@wenyan-md/core/wrapper";
import { getNormalizeFilePath, readStdin } from "../utils.js";
import fs from "node:fs/promises";

interface RenderOptions {
    file?: string;
    theme: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export async function renderCommand(inputContent: string | undefined, options: RenderOptions) {
    try {
        const { file } = options;
        if (!inputContent) {
            if (!process.stdin.isTTY) {
                inputContent = await readStdin();
            }
        }

        if (!inputContent && file) {
            const normalizePath = getNormalizeFilePath(file);
            inputContent = await fs.readFile(normalizePath, "utf-8");
        }

        if (!inputContent) {
            console.error("Error: missing input-content (no argument, no stdin, and no file).");
            process.exit(1);
        }
        const gzhContent = await getGzhContent(
            inputContent,
            options["theme"],
            options["highlight"],
            options["macStyle"],
            options["footnote"]
        );
        console.log(gzhContent.content);
        // process.exit(0);
    } catch (error) {
        if (error instanceof Error) {
            console.error("An unexpected error occurred during publishing:");
            console.error(error.message);
        } else {
            console.error("An unexpected error occurred:", error);
        }
        process.exit(1);
    }
}
