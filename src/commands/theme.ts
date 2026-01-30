import { getAllGzhThemes } from "@wenyan-md/core";
import { ThemeOptions } from "../types.js";
import { getNormalizeFilePath } from "../utils.js";
import fs from "node:fs/promises";
import { configStore } from "@wenyan-md/core/wrapper";

export async function themeCommand(options: ThemeOptions) {
    const { list, add, name, path, rm } = options;
    if (list) {
        listThemes();
        return;
    }
    if (add) {
        await addTheme(name, path);
        return;
    }
    if (rm) {
        await removeTheme(rm);
        return;
    }
}

function listThemes() {
    const themes = getAllGzhThemes();
    console.log("\n内置主题：");
    themes.forEach((theme) => console.log(`- ${theme.meta.id}: ${theme.meta.description}`));
    const customThemes = configStore.getThemes();
    if (customThemes.length > 0) {
        console.log("\n自定义主题：");
        customThemes.forEach((theme) => {
            console.log(`- ${theme.id}: ${theme.description ?? ""}`);
        });
    }
    console.log("");
}

async function addTheme(name?: string, path?: string) {
    if (!name || !path) {
        console.log("❌ 添加主题时必须提供名称(name)和路径(path)\n");
        return;
    }

    if (checkThemeExists(name) || checkCustomThemeExists(name)) {
        console.log(`❌ 主题 "${name}" 已存在\n`);
        return;
    }

    if (path.startsWith("http")) {
        console.log(`⏳ 正在从远程获取主题: ${path} ...`);
        const response = await fetch(path);
        if (!response.ok) {
            console.log(`❌ 无法从远程获取主题: ${response.statusText}\n`);
            return;
        }
        const content = await response.text();
        configStore.addThemeToConfig(name, content);
    } else {
        const normalizePath = getNormalizeFilePath(path);
        const content = await fs.readFile(normalizePath, "utf-8");
        configStore.addThemeToConfig(name, content);
    }
    console.log(`✅ 主题 "${name}" 已添加\n`);
}

async function removeTheme(name: string) {
    if (checkThemeExists(name)) {
        console.log(`❌ 默认主题 "${name}" 不能删除\n`);
        return;
    }
    if (!checkCustomThemeExists(name)) {
        console.log(`❌ 自定义主题 "${name}" 不存在\n`);
        return;
    }
    configStore.deleteThemeFromConfig(name);
    console.log(`✅ 主题 "${name}" 已删除\n`);
}

function checkThemeExists(themeId: string): boolean {
    const themes = getAllGzhThemes();
    return themes.some((theme) => theme.meta.id === themeId);
}

function checkCustomThemeExists(themeId: string): boolean {
    const customThemes = configStore.getThemes();
    return customThemes.some((theme) => theme.id === themeId);
}
