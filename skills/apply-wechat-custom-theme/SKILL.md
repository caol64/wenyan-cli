---
name: "apply-wechat-custom-theme"
description: "AI-ready skill to test, register, and publish Markdown articles to WeChat Official Accounts using a local custom CSS theme via Wenyan CLI."
---

# 微信公众号自定义主题应用与发布工具 (WeChat Custom Theme Applier)

这是一个专门为 AI Agent 设计的技能，用于将本地已经生成好的自定义 CSS 主题文件，应用到 Markdown 文章中，并通过 `wenyan-cli` 进行本地测试预览、主题库注册以及最终推送到微信公众号草稿箱。

## 前置依赖

- 必须已安装 `wenyan-cli`：`npm install -g @wenyan-md/cli`
- 执行发布命令前，环境中必须已配置 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 环境变量。
- 本地必须已存在一个目标 Markdown 文件（如 `article.md`）。
- 本地必须已存在一个目标 CSS 主题文件（如 `custom-theme.css`，通常由 `generate-wechat-css-theme` 技能生成）。

## AI Agent 指令指南：工作流 SOP

当用户要求“使用刚才生成的 `xxx.css` 主题，把 `yyy.md` 发布到公众号”时，Agent **必须** 遵循以下标准操作流程（SOP）：

### Step 1: 测试渲染 (Render Test)[强制第一步]

在正式发布或注册主题之前，Agent 必须先在本地进行一次模拟渲染，以验证 CSS 文件是否存在且没有导致严重的编译错误。

- **命令**：
    ```bash
    wenyan render -f <markdown_file_path> -c <css_file_path>
    ```
- **示例**：
    ```bash
    wenyan render -f my_post.md -c ./cyber-dark-theme.css
    ```
- **动作校验**：如果该命令成功输出了一长串带有 `<div id="wenyan">` 的 HTML 字符串，说明 CSS 注入和 Markdown 解析均正常。如果报错，Agent 需要停止流程并向用户报告错误。

### Step 2: 正式发布 (Publish to Draft)

如果测试渲染通过，Agent 可以直接使用该临时 CSS 文件，将文章推送到微信公众号的草稿箱。

- **核心命令 (一次性应用临时 CSS)**：
    使用 `-c` 或 `--custom-theme` 参数指定本地 CSS 文件的路径。此参数的优先级高于内置主题（`-t`）。
    ```bash
    wenyan publish -f <markdown_file_path> -c <css_file_path>
    ```
- **示例**：
    ```bash
    wenyan publish -f my_post.md -c ./cyber-dark-theme.css
    ```
- **可选参数搭配**：
    - 关闭代码块 Mac 风格窗口：`--no-mac-style`
    - 指定特定的代码高亮主题（如深色主题搭配深色代码块）：`-h atom-one-dark`

### Step 3: 注册为永久主题 (Register Theme) [可选，由用户触发]

如果用户明确表示“我很喜欢这个主题，以后还要用它”，Agent 应将该临时 CSS 文件注册到 `wenyan-cli` 的内部主题库中。

- **命令**：
    ```bash
    wenyan theme --add --name <theme_name> --path <css_file_path>
    ```
- **示例**：
    ```bash
    wenyan theme --add --name cyberpunk --path ./cyber-dark-theme.css
    ```
- **后续使用**：注册成功后，后续发布此文章或其他文章时，就可以抛弃本地的 `.css` 文件，直接使用简写的 `-t` 参数调用了：
    ```bash
    wenyan publish -f another_post.md -t cyberpunk
    ```

### Step 4: 主题库管理 (Theme Management) [按需使用]

Agent 可以使用以下命令帮助用户管理已注册的主题：

- **查看所有可用主题（包括内置和已注册的自定义主题）**：
    ```bash
    wenyan theme -l
    ```
- **删除不再需要的自定义主题**：
    ```bash
    wenyan theme --rm <theme_name>
    ```

## 故障排除 (Agent 专用)

- **Error: missing input-content (no argument, no stdin, and no file)**：Agent 忘记使用 `-f` 指定 Markdown 文件路径。
- **Error: ENOENT: no such file or directory, open 'xxx.css'**：指定的 CSS 文件路径不存在。Agent 需要检查前一个技能生成的 CSS 文件名和路径是否与当前命令匹配。
- **发布后排版错乱/未生效**：通常是因为 CSS 文件中的选择器没有以 `#wenyan` 开头，导致被微信底层过滤掉。Agent 应提示用户检查 CSS 源码。
- **微信 API 报错 (如 invalid credential)**：提示用户检查环境变量 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是否正确配置。
