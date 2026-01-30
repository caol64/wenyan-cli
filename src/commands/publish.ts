import { publishToDraft } from "@wenyan-md/core/publish";
import { RenderOptions } from "../types.js";
import { prepareRenderContext, runCommandWrapper } from "./render.js";

export async function publishCommand(inputContent: string | undefined, options: RenderOptions) {
    await runCommandWrapper(async () => {
        const { gzhContent, absoluteDirPath } = await prepareRenderContext(inputContent, options);

        if (!gzhContent.title) throw new Error("Error: 未能找到文章标题");
        if (!gzhContent.cover) throw new Error("Error: 未能找到文章封面");

        const data = await publishToDraft(gzhContent.title, gzhContent.content, gzhContent.cover, {
            relativePath: absoluteDirPath,
        });

        if (data.media_id) {
            console.log(`上传成功，media_id: ${data.media_id}`);
        } else {
            console.error(`上传失败，\n${data}`);
            process.exit(1);
        }
    });
}
