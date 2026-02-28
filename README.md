<div align="center">
    <img alt = "logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" />
</div>

# 文颜 CLI

[![npm](https://img.shields.io/npm/v/@wenyan-md/cli)](https://www.npmjs.com/package/@wenyan-md/cli)
[![License](https://img.shields.io/github/license/caol64/wenyan-cli)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fcli)
[![Docker Pulls](https://img.shields.io/docker/pulls/caol64/wenyan-cli)](https://hub.docker.com/r/caol64/wenyan-cli)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-cli?style=social)](https://github.com/caol64/wenyan-cli)

## 简介

**[文颜（Wenyan）](https://wenyan.yuzhi.tech)** 是一款多平台 Markdown 排版与发布工具，支持将 Markdown 一键转换并发布至：

-   微信公众号
-   知乎
-   今日头条
-   以及其它内容平台（持续扩展中）

文颜的目标是：**让写作者专注内容，而不是排版和平台适配**。

## 文颜的不同版本

文颜目前提供多种形态，覆盖不同使用场景：

-   [macOS App Store 版](https://github.com/caol64/wenyan) - MAC 桌面应用
-   [跨平台桌面版](https://github.com/caol64/wenyan-pc) - Windows/Linux
-   👉[CLI 版本](https://github.com/caol64/wenyan-cli) - 本项目
-   [MCP 版本](https://github.com/caol64/wenyan-mcp) - AI 自动发文
-   [UI 库](https://github.com/caol64/wenyan-ui) - 桌面应用和 Web App 共用的 UI 层封装
-   [核心库](https://github.com/caol64/wenyan-core) - 嵌入 Node / Web 项目

## 安装方式

### 方式一：npm（推荐）

```bash
npm install -g @wenyan-md/cli
```

安装完成后即可使用：

```bash
wenyan --help
```

### 方式二：Docker（无需 Node 环境）

如果你不想在本地安装 Node.js，也可以直接使用 Docker。

**拉取镜像**

```bash
docker pull caol64/wenyan-cli
```

**查看帮助**

```bash
docker run --rm caol64/wenyan-cli
```

**发布文章示例**

```bash
docker run --rm \
  --env-file .env.test \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  caol64/wenyan-cli \
  publish -f ./test/publish.md -t phycat
```

> 说明：
>
> -   使用 `-e` 传入环境变量
> -   使用 `-v` 挂载本地 Markdown 文件
> -   容器启动即执行 `wenyan` 命令

## 基本用法

CLI 主命令：

```bash
wenyan <command>[options]
```

目前支持的子命令有：
- `publish` 排版并发布到公众号草稿箱（支持纯本地模式与 Client-Server 远程发布模式）
- `render` 仅排版并输出 HTML，用于本地测试
- `theme` 终端主题管理
- `serve` 启动 HTTP 服务器，提供渲染和发布接口（Server 模式）

## 子命令详解

### `publish`

将 Markdown 转换为适配微信公众号的富文本 HTML，并上传到草稿箱。

#### 参数

-   `<input-content>`
    Markdown 内容，可以直接作为参数传入，或通过 stdin 管道输入。

#### 常用排版选项

-   `-t, --theme <theme-id>`：主题id（默认 `default`），支持内置主题或通过 `theme --add` 添加的自定义主题。
    -   [内置主题一览](https://github.com/caol64/wenyan-core/tree/main/src/assets/themes)
-   `-c, --custom-theme <path>`：指定临时自定义主题的本地/网络路径（优先级高于 `-t`）
-   `-h, --highlight <highlight-theme-id>`：代码高亮主题（默认 `solarized-light`）
    -   支持：atom-one-dark / atom-one-light / dracula / github-dark / github / monokai / solarized-dark / solarized-light / xcode
-   `-f, --file <path>`：指定本地 Markdown 文件路径
-   `--no-mac-style`：关闭代码块 Mac 窗口风格
-   `--no-footnote`：关闭链接转脚注功能

#### 远程模式选项 (Client-Server 架构)

为了解决微信公众号 API 需要固定 IP 的限制，你可以将 CLI 配置为客户端模式，连接到部署在云服务器上的文颜 Server。**在此模式下，客户端会自动解析 Markdown 中的本地图片（包括封面），一并自动上传至 Server 处理，体验与本地发布完全一致！**

-   `--server <url>`：指定远程文颜 Server 的地址（例如：`https://api.yourdomain.com`）
-   `--api-key <apiKey>`：请求 Server 的鉴权密钥

#### 使用示例

**【本地模式】（需要当前机器拥有固定的公网 IP 并已加入微信白名单）**

直接传入内容：

```bash
wenyan publish "# Hello, Wenyan" -t lapis -h solarized-light
```

从管道读取：

```bash
cat example.md | wenyan publish -t lapis -h solarized-light --no-mac-style
```

从文件读取：

```bash
wenyan publish -f "./example.md" -t lapis -h solarized-light --no-mac-style
```

**【远程客户端模式】（无需配置微信环境，一键委托云端 Server 发布）**
```bash
wenyan publish -f "./example.md" -t lapis --server https://localhost:3000 --api-key "my-secret-key"
```

---

### `theme`

主题管理，浏览内置主题、添加/删除自定义主题。

#### 常用选项

-   `-l, --list`：列出所有可用主题
-   `--add`：添加自定义主题（永久）
    -   `--name <name>`：主题名称
    -   `--path <path>`：主题路径（本地路径或网络 URL）
-   `--rm <name>`：删除自定义主题

#### 使用示例

```bash
# 列出可用主题
wenyan theme -l

# 安装自定义主题
wenyan theme --add --name new-theme --path https://wenyan.yuzhi.tech/manhua.css

# 删除自定义主题
wenyan theme --rm new-theme
```

### `serve`

启动 HTTP 服务器，提供 REST API 接口。适用于部署在云服务器上，完美解决本地网络环境多变导致**无法通过微信公众号 API 白名单**的问题。

#### 常用选项

-   `-p, --port <port>`：监听端口（默认 `3000`）
-   `--api-key <apiKey>`：开启 API 调用鉴权。若设置，客户端必须提供相同的密钥。

#### 使用示例

在具有固定 IP 的云服务器上启动服务：

```bash
# 务必在服务器环境变量中配置好 WECHAT_APP_ID 和 WECHAT_APP_SECRET
wenyan serve --port 3000 --api-key "my-secret-key"
```

#### [API 接口设计](docs/server.md)

## 关于图片与封面自动上传

无论是本地模式还是通过 `--server` 的客户端模式，文颜 CLI 都提供**极度智能**的图片处理机制：

- 识别并支持本地硬盘绝对路径（如：`/Users/xxx/image.jpg`）
- 识别并支持当前目录的相对路径（如：`./assets/image.png`）
- 识别并支持网络路径（如：`https://example.com/image.jpg`）

## 环境变量配置

在实际向微信公众号发文的环境（你的本地或部署 `serve` 的服务器）中，必须配置以下环境变量：

-   `WECHAT_APP_ID`
-   `WECHAT_APP_SECRET`

### macOS / Linux

临时使用：

```bash
WECHAT_APP_ID=xxx WECHAT_APP_SECRET=yyy wenyan publish "your markdown"
```

永久配置（推荐，写入 `~/.bashrc` 或 `~/.zshrc`）：
```bash
export WECHAT_APP_ID=xxx
export WECHAT_APP_SECRET=yyy
```

### Windows (PowerShell)

临时使用：
```powershell
$env:WECHAT_APP_ID="xxx"
$env:WECHAT_APP_SECRET="yyy"
wenyan publish example.md
```

永久设置（推荐）：

控制面板 → 系统和安全 → 系统 → 高级系统设置 → 环境变量 → 添加 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。

## 微信公众号 IP 白名单

> [!IMPORTANT]
>
> 请确保运行文颜的机器 IP 已加入微信公众号后台的 IP 白名单，否则上传接口将调用失败。

配置说明文档：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

## Markdown Frontmatter 说明（必读）

为了正确上传文章，每篇 Markdown 顶部需要包含 frontmatter：

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/xxx/image.jpg
author: xxx
source_url: http://
---
```

字段说明：

-   `title` 文章标题（必填）
-   `cover` 文章封面
    -   本地路径或网络图片
    -   如果正文中已有图片，可省略
-   `author` 文章作者
-   `source_url` 原文地址

## 示例文章格式

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/lei/Downloads/result_image.jpg
---

在[上一篇文章](https://babyno.top/posts/2024/02/running-a-large-language-model-locally/)中，我们展示了如何在本地运行大型语言模型。本篇将介绍如何让模型从外部知识库中检索定制数据，提升答题准确率，让它看起来更“智能”。

## 准备模型

访问 `Ollama` 的模型页面，搜索 `qwen`，我们使用支持中文语义的“[通义千问](https://ollama.com/library/qwen:7b)”模型进行实验。

![](https://mmbiz.qpic.cn/mmbiz_jpg/Jsq9IicjScDVUjkPc6O22ZMvmaZUzof5bLDjMyLg2HeAXd0icTvlqtL7oiarSlOicTtiaiacIxpVOV1EeMKl96PhRPPw/640?wx_fmt=jpeg)
```

## 赞助

如果你觉得文颜对你有帮助，可以给我家猫咪买点罐头 ❤️

[https://yuzhi.tech/sponsor](https://yuzhi.tech/sponsor)

## License

Apache License Version 2.0
