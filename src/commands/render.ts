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
        const gzhContent = await getGzhContent(inputContent, options["theme"], options["highlight"], options["macStyle"]);
        console.log(gzhContent.content);
        // process.exit(0);
    } catch (error) {
        console.error("An unexpected error occurred during rendering:");
        console.error(error);
        process.exit(1);
    }
}
