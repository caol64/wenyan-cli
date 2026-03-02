import { getAllGzhThemes } from "@wenyan-md/core";
import { getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { configStore } from "@wenyan-md/core/wrapper";
import { AppError } from "../types.js";

export interface ThemeOptions {
    list?: boolean;
    add?: boolean;
    name?: string;
    path?: string;
    rm?: string;
}

export interface ThemeInfo {
    id: string;
    name: string;
    description?: string;
    isBuiltin: boolean;
}

export function listThemes(): ThemeInfo[] {
    const themes = getAllGzhThemes();
    const themeList: ThemeInfo[] = themes.map((theme) => {
        return {
            id: theme.meta.id,
            name: theme.meta.name,
            description: theme.meta.description,
            isBuiltin: true,
        };
    });
    const customThemes = configStore.getThemes();
    if (customThemes.length > 0) {
        customThemes.forEach((theme) => {
            themeList.push({
                id: theme.id,
                name: theme.id,
                description: theme.description,
                isBuiltin: false,
            });
        });
    }
    return themeList;
}

export async function addTheme(name?: string, path?: string) {
    if (!name || !path) {
        throw new AppError("添加主题时必须提供名称(name)和路径(path)");
    }

    if (checkThemeExists(name) || checkCustomThemeExists(name)) {
        throw new AppError(`主题 "${name}" 已存在`);
    }

    if (path.startsWith("http")) {
        console.log(`正在从远程获取主题: ${path} ...`);
        const response = await fetch(path);
        if (!response.ok) {
            throw new AppError(`无法从远程获取主题: ${response.statusText}`);
        }
        const content = await response.text();
        configStore.addThemeToConfig(name, content);
    } else {
        const normalizePath = getNormalizeFilePath(path);
        const content = await fs.readFile(normalizePath, "utf-8");
        configStore.addThemeToConfig(name, content);
    }
}

export async function removeTheme(name: string) {
    if (checkThemeExists(name)) {
        throw new AppError(`默认主题 "${name}" 不能删除`);
    }
    if (!checkCustomThemeExists(name)) {
        throw new AppError(`自定义主题 "${name}" 不存在`);
    }
    configStore.deleteThemeFromConfig(name);
}

function checkThemeExists(themeId: string): boolean {
    const themes = getAllGzhThemes();
    return themes.some((theme) => theme.meta.id === themeId);
}

function checkCustomThemeExists(themeId: string): boolean {
    const customThemes = configStore.getThemes();
    return customThemes.some((theme) => theme.id === themeId);
}
