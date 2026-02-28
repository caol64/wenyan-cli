import { publishToWechatDraft } from "@wenyan-md/core/publish";
import { RenderOptions } from "../types.js";
import { prepareRenderContext } from "./render.js";

export async function publishCommand(inputContent: string | undefined, options: RenderOptions): Promise<string> {
    const { gzhContent, absoluteDirPath } = await prepareRenderContext(inputContent, options);

    if (!gzhContent.title) throw new Error("Error: 未能找到文章标题");
    if (!gzhContent.cover) throw new Error("Error: 未能找到文章封面");

    const data = await publishToWechatDraft(
        {
            title: gzhContent.title,
            content: gzhContent.content,
            cover: gzhContent.cover,
            author: gzhContent.author,
            source_url: gzhContent.source_url,
        },
        {
            relativePath: absoluteDirPath,
        },
    );

    if (data.media_id) {
        return data.media_id;
    } else {
        throw new Error(`Error: 上传失败，\n${data}`);
    }
}
