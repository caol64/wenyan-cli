import { configStore, renderStyledContent, StyledContent } from "@wenyan-md/core/wrapper";
import { getNormalizeFilePath, readStdin } from "../utils.js";
import fs from "node:fs/promises";
import path from "node:path";
import { AppError, RenderOptions } from "../types.js";

interface RenderContext {
    gzhContent: StyledContent;
    absoluteDirPath: string | undefined;
}

// --- 处理输入源、文件路径和主题 ---
export async function prepareRenderContext(
    inputContent: string | undefined,
    options: RenderOptions,
): Promise<RenderContext> {
    const { file, theme, customTheme, highlight, macStyle, footnote } = options;
    let absoluteDirPath: string | undefined = undefined;

    // 1. 尝试从 Stdin 读取
    if (!inputContent && !process.stdin.isTTY) {
        inputContent = await readStdin();
    }

    // 2. 尝试从文件读取
    if (!inputContent && file) {
        const normalizePath = getNormalizeFilePath(file);
        inputContent = await fs.readFile(normalizePath, "utf-8");
        absoluteDirPath = path.dirname(normalizePath);
    }

    // 3. 校验输入
    if (!inputContent) {
        throw new AppError("missing input-content (no argument, no stdin, and no file).");
    }

    let handledCustomTheme: string | undefined = customTheme;
    // 4. 当用户传入自定义主题路径时，优先级最高
    if (customTheme) {
        const normalizePath = getNormalizeFilePath(customTheme);
        handledCustomTheme = await fs.readFile(normalizePath, "utf-8");
    } else if (theme) {
        // 否则尝试读取配置中的自定义主题
        handledCustomTheme = configStore.getThemeById(theme);
    }

    if (!handledCustomTheme && !theme) {
        throw new AppError(`theme "${theme}" not found.`);
    }

    // 5. 执行核心渲染
    const gzhContent = await renderStyledContent(inputContent, {
        themeId: theme,
        hlThemeId: highlight,
        isMacStyle: macStyle,
        isAddFootnote: footnote,
        themeCss: handledCustomTheme,
    });

    return { gzhContent, absoluteDirPath };
}
