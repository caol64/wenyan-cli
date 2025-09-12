import { getGzhContent } from "@wenyan-md/core/wrapper";
import { publishToDraft } from "@wenyan-md/core/publish";
import { readStdin } from "../utils.js"

interface RenderOptions {
    output?: string;
    theme: string;
    highlight: string;
    macStyle: boolean;
}

export async function publishCommand(inputContent: string, options: RenderOptions) {
    try {
        if (!inputContent) {
            if (process.stdin.isTTY) {
                console.error("Error: missing input-content (no argument and no stdin).");
                process.exit(1);
            }
            inputContent = await readStdin();
        }
        const gzhContent = await getGzhContent(inputContent, options["theme"], options["highlight"], options["macStyle"], options["footnote"]);
        if (!gzhContent.title) {
            console.error("未能找到文章标题");
            process.exit(1);
        }
        if (!gzhContent.cover) {
            console.error("未能找到文章封面");
            process.exit(1);
        }
        const data = await publishToDraft(gzhContent.title, gzhContent.content, gzhContent.cover);
        if (data.media_id) {
            console.log(`上传成功，media_id: ${data.media_id}`);
        } else {
            console.error(`上传失败，\n${data}`);
        }
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
