import { getGzhContent } from "@wenyan-md/core/wrapper";
import { publishToDraft } from "@wenyan-md/core/publish";
import { getNormalizeFilePath, readStdin } from "../utils.js";
import fs from "node:fs/promises";
import path from "node:path";

interface RenderOptions {
    file?: string;
    theme: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export async function publishCommand(inputContent: string | undefined, options: RenderOptions) {
    try {
        const { file } = options;
        let absoluteDirPath: string | undefined = undefined;
        if (!inputContent) {
            if (!process.stdin.isTTY) {
                inputContent = await readStdin();
            }
        }

        if (!inputContent && file) {
            const normalizePath = getNormalizeFilePath(file);
            inputContent = await fs.readFile(normalizePath, "utf-8");
            absoluteDirPath = path.dirname(normalizePath);
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
        if (!gzhContent.title) {
            console.error("未能找到文章标题");
            process.exit(1);
        }
        if (!gzhContent.cover) {
            console.error("未能找到文章封面");
            process.exit(1);
        }
        const data = await publishToDraft(gzhContent.title, gzhContent.content, gzhContent.cover, {
            relativePath: absoluteDirPath,
        });
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
