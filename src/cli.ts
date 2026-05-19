#!/usr/bin/env node
import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import {
    addTheme,
    ClientPublishOptions,
    listThemes,
    prepareRenderContext,
    removeTheme,
    renderAndPublish,
    renderAndPublishToServer,
    RenderOptions,
    ThemeOptions,
    configDir,
    credentialStore,
    wechatPublisher,
} from "@wenyan-md/core/wrapper";
import { getInputContent } from "./utils.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import input from "@inquirer/input";
import password from "@inquirer/password";
import select from "@inquirer/select";
import fs from "node:fs/promises";
import { loadEnvFile } from "node:process";

interface CLIPublishOptions extends ClientPublishOptions {
    proxy?: string;
    envFile?: string;
}

export function createProgram(version: string = pkg.version): Command {
    const program = new Command();

    program
        .name("wenyan")
        .description("CLI for WenYan - A Markdown render and publisher tool.")
        .version(version, "-v, --version", "output the current version")
        .action(() => {
            program.outputHelp();
        });

    const addCommonOptions = (cmd: Command) => {
        return cmd
            .argument("[input-content]", "markdown content (string input)")
            .option("-f, --file <path>", "read markdown content from local file or web URL")
            .option("-t, --theme <theme-id>", "ID of the theme to use", "default")
            .option("-h, --highlight <highlight-theme-id>", "ID of the code highlight theme to use", "solarized-light")
            .option("-c, --custom-theme <path>", "path to custom theme CSS file")
            .option("--mac-style", "display codeblock with mac style", true)
            .option("--no-mac-style", "disable mac style")
            .option("--footnote", "convert link to footnote", true)
            .option("--no-footnote", "disable footnote");
    };

    const pubCmd = program
        .command("publish")
        .description("Render a markdown file to styled HTML and publish to wechat MP platform");

    // 先添加公共选项，再追加 publish 专属选项
    addCommonOptions(pubCmd)
        .option("--app-id <appId>", "AppID for the WeChat MP platform")
        .option("--server <url>", "Server URL to publish through (e.g. https://api.yourdomain.com)")
        .option("--api-key <apiKey>", "API key for the remote server")
        .option("--env-file <file>", "Path to a .env file to load environment variables from")
        .option("--proxy <url>", "Proxy URL to use for requests, ex: http://127.0.0.1:1080")
        .action(async (inputContent: string | undefined, options: CLIPublishOptions) => {
            await runCommandWrapper(async () => {
                // 读取环境变量文件（如果提供了 --env-file 选项）
                if (options.envFile) {
                    loadEnvFile(options.envFile);
                }

                // 设置代理（如果提供了 --proxy 选项）
                await setupProxy(options.proxy);

                // 如果传入了 --server，则走客户端（远程）模式
                if (options.server) {
                    options.clientVersion = version; // 将 CLI 版本传递给服务器，便于调试和兼容性处理
                    const mediaId = await renderAndPublishToServer(inputContent, options, getInputContent);
                    console.log(`发布成功，Media ID: ${mediaId}`);
                } else {
                    // 走原有的本地直接发布模式
                    const mediaId = await renderAndPublish(inputContent, options, getInputContent);
                    console.log(`发布成功，Media ID: ${mediaId}`);
                }
            });
        });

    const renderCmd = program.command("render").description("Render a markdown file to styled HTML");

    addCommonOptions(renderCmd).action(async (inputContent: string | undefined, options: RenderOptions) => {
        await runCommandWrapper(async () => {
            const { gzhContent } = await prepareRenderContext(inputContent, options, getInputContent);
            console.log(gzhContent.content);
        });
    });

    program
        .command("theme")
        .description("Manage themes")
        .option("-l, --list", "List all available themes")
        .option("--add", "Add a new custom theme")
        .option("--name <name>", "Name of the new custom theme")
        .option("--path <path>", "Path to the new custom theme CSS file")
        .option("--rm <name>", "Name of the custom theme to remove")
        .action(async (options: ThemeOptions) => {
            if (Object.keys(options).length === 0) {
                program.commands.find((c) => c.name() === "theme")?.outputHelp();
                return;
            }
            await runCommandWrapper(async () => {
                const { list, add, name, path, rm } = options;
                if (list) {
                    const themes = await listThemes();
                    console.log("内置主题：");
                    themes
                        .filter((theme) => theme.isBuiltin)
                        .forEach((theme) => {
                            console.log(`- ${theme.id}: ${theme.description ?? ""}`);
                        });
                    const customThemes = themes.filter((theme) => !theme.isBuiltin);
                    if (customThemes.length > 0) {
                        console.log("\n自定义主题：");
                        customThemes.forEach((theme) => {
                            console.log(`- ${theme.id}: ${theme.description ?? ""}`);
                        });
                    }
                    return;
                }
                if (add) {
                    await addTheme(name, path);
                    console.log(`主题 "${name}" 已添加`);
                    return;
                }
                if (rm) {
                    await removeTheme(rm);
                    console.log(`主题 "${rm}" 已删除`);
                }
            });
        });

    program
        .command("serve")
        .description("Start a server to provide HTTP API for rendering and publishing")
        .option("-p, --port <port>", "Port to listen on (default: 3000)", "3000")
        .option("--api-key <apiKey>", "API key for authentication")
        .option("--env-file <file>", "Path to a .env file to load environment variables from")
        .action(async (options: { port?: string; apiKey?: string; envFile?: string }) => {
            try {
                // 读取环境变量文件（如果提供了 --env-file 选项）
                if (options.envFile) {
                    loadEnvFile(options.envFile);
                }
                const { serveCommand } = await import("./commands/serve.js");
                const port = options.port ? parseInt(options.port, 10) : 3000;
                await serveCommand({ port, version, apiKey: options.apiKey });
            } catch (error: any) {
                console.error(error.message);
                process.exit(1);
            }
        });

    program
        .command("credential")
        .description("Manage wechat credentials (e.g. AppID and AppSecret)")
        .option("-l, --location", "Get the storage location of configuration credentials")
        .option("-s, --set", "Interactively set the wechat credentials (AppID & AppSecret)")
        .action(async (options: { location?: boolean; set?: boolean }) => {
            if (Object.keys(options).length === 0) {
                program.commands.find((c) => c.name() === "credential")?.outputHelp();
                return;
            }
            await runCommandWrapper(async () => {
                if (options.location) {
                    console.log(path.join(configDir, "credential.json"));
                    return;
                }
                if (options.set) {
                    console.log("请输入微信公众号的开发者凭据：");
                    const appId = await input({
                        message: "AppID:",
                        validate: (value) => value.trim().length > 0 || "AppID 不能为空",
                    });

                    const appSecret = await password({
                        message: "AppSecret:",
                        mask: true,
                        validate: (value) => value.trim().length > 0 || "AppSecret 不能为空",
                    });

                    const alias = await input({
                        message: "别名 (用于简化 AppID ，按回车跳过):",
                        validate: (value) => true, // Alias is optional, so always return true
                    });

                    await credentialStore.saveWechatCredential(appId.trim(), appSecret.trim(), alias.trim() || null);
                    console.log("微信凭据已安全保存！");
                }
            });
        });

    program
        .command("token")
        .description("Manage wechat accessToken")
        .option("-l, --location", "Get the storage location of access token")
        .option("-i, --import", "Import an external access token (disables auto-refresh)")
        .option("--app-id <appId>", "WeChat AppID")
        .option("--token <token>", "External Access Token")
        .action(async (options: { location?: boolean; import?: boolean; appId?: string; token?: string }) => {
            if (Object.keys(options).length === 0) {
                program.commands.find((c) => c.name() === "token")?.outputHelp();
                return;
            }
            await runCommandWrapper(async () => {
                if (options.location) {
                    console.log(path.join(configDir, "token.json"));
                    return;
                }
                if (options.import) {
                    const { appId, token } = options;

                    // 参数必填校验
                    if (!appId || !token) {
                        console.error("导入 Token 时必须同时提供 --app-id 和 --token 参数。");
                        process.exit(1);
                    }


                    await wechatPublisher.setExternalToken(appId, token);

                    console.log(`成功导入 AppID [${appId}] 的外部 Token。`);
                    console.log("提示: 该 Token 的 expireAt 已设为 -1，Wenyan 将不再管理其生命周期。");
                }
            });
        });

    program
        .command("draft")
        .description("Manage wechat MP drafts (list / append / replace / update)")
        .option("-l, --list", "List all drafts")
        .option("-u, --update <mediaId>", "Update a draft directly (with --file or --title)")
        .option("-f, --file <path>", "Markdown file path (full replace)")
        .option("-t, --title <title>", "New title for the draft")
        .option("-a, --append <text>", "Append text to the end of draft content")
        .option("-s, --search <text>", "Text to search for (for --replace)")
        .option("-r, --replace <text>", "Text to replace the searched text with")
        .option("-c, --cover <path>", "Cover image path")
        .option("-i, --interactive", "Interactive mode: select draft and edit options")
        .option("--app-id <appId>", "AppID for the WeChat MP platform")
        .option("--index <index>", "Article index to update (default: 0)", "0")
        .action(async (options: Record<string, any>) => {
            await runCommandWrapper(async () => {
                // 获取凭据
                const appId = options.appId;
                const credData = await (async () => {
                    const { safeReadJson } = await import("@wenyan-md/core/wrapper");
                    return await safeReadJson(path.join(configDir, "credential.json"), {});
                })();
                const firstAppId = Object.keys(credData.wechat || {})[0];
                const credential = await credentialStore.getWechatCredential(appId || firstAppId);
                if (!credential) {
                    console.error("请先配置公众号凭据: wenyan credential -s");
                    process.exit(1);
                }
                let appIdFinal = credential.appId;
                let appSecretFinal = credential.appSecret;
                if (!appSecretFinal && process.env.WECHAT_APP_SECRET) {
                    appSecretFinal = process.env.WECHAT_APP_SECRET;
                }
                const accessToken = await wechatPublisher.getAccessTokenWithCache(appIdFinal, appSecretFinal);

                // ─── 交互模式 ───
                if (options.interactive || (!options.list && !options.update && !options.append && !options.search && !options.replace)) {
                    console.log("正在获取草稿列表...");
                    const result = await wechatPublisher.listDrafts(accessToken, 0, 20, 0);
                    if (!result.item || result.item.length === 0) {
                        console.log("暂无草稿");
                        return;
                    }
                    const choices = result.item.map((item: any) => {
                        const title = item.content.news_item?.[0]?.title || "(无标题)";
                        return { name: `${title} (${item.media_id.slice(0, 20)}...)`, value: item.media_id };
                    });
                    const mediaId = await select({ message: "选择要编辑的草稿:", choices });
                    const articleIndex = parseInt(options.index, 10) || 0;
                    console.log("正在获取草稿内容...");
                    const draftData = await wechatPublisher.getDraft(accessToken, mediaId);
                    const newsItem = draftData.news_item?.[articleIndex];
                    if (!newsItem) { console.error("未找到文章"); process.exit(1); }
                    const updateData = { ...newsItem };
                    const actionChoice = await select({
                        message: "选择操作:",
                        choices: [
                            { name: "修改标题", value: "title" },
                            { name: "追加内容到末尾", value: "append" },
                            { name: "搜索替换指定文字", value: "replace" },
                            { name: "用Markdown文件替换全文", value: "file" },
                        ]
                    });
                    if (actionChoice === "title") {
                        updateData.title = await input({ message: "新标题:", default: updateData.title });
                    } else if (actionChoice === "append") {
                        const appendText = await input({ message: "要追加的内容 (纯文本):" });
                        let htmlSnippet = appendText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
                        if (!/^<p>/i.test(htmlSnippet)) htmlSnippet = '<p>' + htmlSnippet + '</p>';
                        updateData.content = (updateData.content || '') + htmlSnippet;
                        console.log("  已追加内容");
                    } else if (actionChoice === "replace") {
                        const searchText = await input({ message: "要查找的文字:" });
                        const replaceText = await input({ message: "替换为:" });
                        const content = updateData.content || '';
                        const count = (content.match(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        if (!content.includes(searchText)) {
                            console.error(`未找到"${searchText}"`);
                            process.exit(1);
                        }
                        updateData.content = content.split(searchText).join(replaceText);
                        console.log(`  已替换 ${count} 处`);
                    } else if (actionChoice === "file") {
                        options.file = await input({ message: "Markdown文件路径:" });
                        await applyFileUpdate(options, updateData, appIdFinal, accessToken);
                    }
                    delete updateData.update_time;
                    delete updateData.is_top;
                    delete updateData.digest;
                    delete updateData.url;
                    delete updateData.need_open_comment;
                    delete updateData.only_fans_can_comment;
                    console.log("正在更新草稿...");
                    await wechatPublisher.updateDraft(accessToken, mediaId, articleIndex, updateData);
                    console.log(`✅ 草稿更新成功! MediaID: ${mediaId}`);
                    return;
                }

                // ─── 列表模式 ───
                if (options.list) {
                    console.log("正在获取草稿列表...\n");
                    const result = await wechatPublisher.listDrafts(accessToken, 0, 20, 0);
                    if (!result.item || result.item.length === 0) {
                        console.log("暂无草稿");
                        return;
                    }
                    console.log(`共 ${result.total_count} 篇草稿:\n`);
                    result.item.forEach((item: any, i: number) => {
                        const { media_id, content } = item;
                        const articles = content.news_item || [];
                        articles.forEach((article: any, j: number) => {
                            const title = article.title || "(无标题)";
                            const updateTime = article.update_time ? new Date(article.update_time * 1000).toLocaleString("zh-CN") : "";
                            const digest = article.digest || "";
                            console.log(`  [${i * 10 + j + 1}] ${title}`);
                            console.log(`      MediaID: ${media_id}`);
                            console.log(`      摘要: ${digest ? digest.slice(0, 60) + "..." : "(无)"}`);
                            console.log(`      更新时间: ${updateTime}\n`);
                        });
                    });
                    return;
                }

                // ─── 更新模式 ───
                if (options.update || options.search || options.append) {
                    const mediaId = options.update || "";
                    const articleIndex = parseInt(options.index, 10) || 0;
                    if (!options.update) {
                        console.error("需要指定 -u <mediaId> 来定位草稿，或用 -i 交互模式");
                        process.exit(1);
                    }
                    if (!options.file && !options.title && !options.append && !options.search) {
                        console.error("更新草稿需要至少指定更新内容: --file, --title, --append, 或 --search+--replace");
                        process.exit(1);
                    }
                    console.log("正在获取草稿当前内容...");
                    const draftData = await wechatPublisher.getDraft(accessToken, mediaId);
                    const newsItem = draftData.news_item?.[articleIndex];
                    if (!newsItem) {
                        console.error(`未找到索引 ${articleIndex} 的文章`);
                        process.exit(1);
                    }
                    const updateData = { ...newsItem };
                    if (options.title) updateData.title = options.title;
                    if (options.append) {
                        let htmlSnippet = options.append.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
                        if (!/^<p>/i.test(htmlSnippet)) htmlSnippet = '<p>' + htmlSnippet + '</p>';
                        updateData.content = (updateData.content || '') + htmlSnippet;
                        console.log("  已追加内容");
                    }
                    if (options.search) {
                        const searchText = options.search;
                        const replaceText = options.replace || '';
                        const count = (updateData.content.match(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        if (!(updateData.content || '').includes(searchText)) {
                            console.error(`未找到"${searchText}"`);
                            process.exit(1);
                        }
                        updateData.content = updateData.content.split(searchText).join(replaceText);
                        console.log(`  已替换 ${count} 处`);
                    }
                    if (options.file) {
                        await applyFileUpdate(options, updateData, appIdFinal, accessToken);
                    }
                    if (options.cover) {
                        const coverResp = await wechatPublisher.uploadImage(
                            new Blob([await fs.readFile(options.cover)], { type: "image/jpeg" }),
                            "cover.jpg",
                            accessToken,
                            appIdFinal
                        );
                        updateData.thumb_media_id = coverResp.media_id;
                    }
                    delete updateData.update_time;
                    delete updateData.is_top;
                    delete updateData.digest;
                    delete updateData.url;
                    delete updateData.need_open_comment;
                    delete updateData.only_fans_can_comment;
                    console.log("正在更新草稿...");
                    await wechatPublisher.updateDraft(accessToken, mediaId, articleIndex, updateData);
                    console.log(`✅ 草稿更新成功! MediaID: ${mediaId}`);
                    return;
                }
                program.commands.find((c) => c.name() === "draft")?.outputHelp();
            });
        });

    return program;
}

// ─── 文件替换辅助函数 ───
async function applyFileUpdate(options: Record<string, any>, updateData: any, appIdFinal: string, accessToken: string) {
    const content = await fs.readFile(options.file, "utf-8");
    const { handleFrontMatter } = await import("@wenyan-md/core/core");
    const frontMatterResult: any = handleFrontMatter ? handleFrontMatter(content) : { content, title: updateData.title };
    if (frontMatterResult.title) updateData.title = frontMatterResult.title;
    const { renderWithTheme } = await import("@wenyan-md/core/wrapper");
    const styledHtml = await renderWithTheme(frontMatterResult.content, {
        theme: options.theme || "default",
        highlight: options.highlight || "solarized-light",
        macStyle: true,
        footnote: true,
    });
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM("<body>" + styledHtml + "</body>");
    const doc = dom.window.document;
    const images = Array.from(doc.querySelectorAll("img"));
    let firstId = "";
    for (const img of images) {
        const src = img.getAttribute("src");
        if (src && !src.startsWith("https://mmbiz.qpic.cn")) {
            try {
                const resp = await wechatPublisher.uploadImage(
                    new Blob([await (await fetch(src)).arrayBuffer()], { type: "image/jpeg" }),
                    "img.jpg",
                    accessToken,
                    appIdFinal
                );
                img.setAttribute("src", resp.url);
                if (!firstId) firstId = resp.media_id;
            } catch (e: any) {
                console.error(`  跳过图片上传: ${e.message}`);
            }
        }
    }
    updateData.content = doc.body.innerHTML;
    if (options.cover) {
        const coverResp = await wechatPublisher.uploadImage(
            new Blob([await fs.readFile(options.cover)], { type: "image/jpeg" }),
            "cover.jpg",
            accessToken,
            appIdFinal
        );
        updateData.thumb_media_id = coverResp.media_id;
    } else if (firstId && !updateData.thumb_media_id) {
        updateData.thumb_media_id = firstId;
    }
}

// --- 统一的错误处理包装器 ---
async function runCommandWrapper(action: () => Promise<void>) {
    try {
        await action();
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("An unexpected error occurred:", error);
        }
        process.exit(1);
    }
}

async function setupProxy(proxyUrl?: string) {
    const url =
        proxyUrl ||
        process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        process.env.HTTP_PROXY ||
        process.env.http_proxy ||
        process.env.ALL_PROXY;
    if (!url) return;
    const { ProxyAgent, setGlobalDispatcher, install } = await import("undici");
    const cleanUrl = url.trim();
    const agent = new ProxyAgent(cleanUrl);
    setGlobalDispatcher(agent);
    install();
    console.error(`[Proxy] Global fetch proxy enabled: ${cleanUrl}`);
}

export const program = createProgram();

// 仅在作为主模块运行时执行 parse，防止测试文件 import 时意外触发
// import.meta.main 在 Node.js >= 22.18.0 中可用，旧版本通过路径比较回退检测
function isMainModule(): boolean {
    if (import.meta.main !== undefined) return import.meta.main;
    if (!process.argv[1]) return false;
    try {
        return fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
    } catch {
        return false;
    }
}

if (isMainModule()) {
    program.parse(process.argv);
}
