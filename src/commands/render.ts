import { getGzhContent } from "@wenyan-md/core/wrapper";
import { readStdin } from "../utils.js"

interface RenderOptions {
    output?: string;
    theme: string;
    highlight: string;
    macStyle: boolean;
}

export async function renderCommand(inputContent: string | undefined, options: RenderOptions) {
    try {
        if (!inputContent) {
            if (process.stdin.isTTY) {
                console.error("Error: missing input-content (no argument and no stdin).");
                process.exit(1);
            }
            inputContent = await readStdin();
        }
        const gzhContent = await getGzhContent(inputContent, options["theme"], options["highlight"], options["macStyle"], options["footnote"]);
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
