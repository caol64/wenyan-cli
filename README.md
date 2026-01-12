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

**文颜（Wenyan）** 是一款多平台 Markdown 排版与发布工具，支持将 Markdown 一键转换并发布至：

-   微信公众号
-   知乎
-   今日头条
-   以及其它内容平台（持续扩展中）

文颜的目标是：**让写作者专注内容，而不是排版和平台适配**。

本仓库是 **文颜的 CLI 版本**，适合以下场景：

-   命令行使用
-   CI / CD 自动化发布
-   脚本或工具链集成
-   与 AI / MCP 系统联动自动发文

## 文颜的不同版本

文颜目前提供多种形态，覆盖不同使用场景：

-   [macOS App Store 版](https://github.com/caol64/wenyan) - MAC 桌面应用
-   [跨平台桌面版](https://github.com/caol64/wenyan-pc) - Windows/Linux
-   👉 [CLI 版本](https://github.com/caol64/wenyan-cli) - 本项目
-   [MCP 版本](https://github.com/caol64/wenyan-mcp) - AI 自动发文
-   [核心库](https://github.com/caol64/wenyan-core) - 嵌入 Node / Web 项目

## 功能特性

-   使用内置主题对 Markdown 内容排版
-   自动处理并上传图片（本地 / 网络）
-   支持数学公式（MathJax）
-   一键发布文章到微信公众号草稿箱
-   支持 CI / 自动化流程调用

## 主题效果预览

👉 [内置主题预览](https://yuzhi.tech/docs/wenyan/theme)

文颜内置并适配了多个优秀的 Typora 主题，在此感谢原作者：

-   [Orange Heart](https://github.com/evgo2017/typora-theme-orange-heart)
-   [Rainbow](https://github.com/thezbm/typora-theme-rainbow)
-   [Lapis](https://github.com/YiNNx/typora-theme-lapis)
-   [Pie](https://github.com/kevinzhao2233/typora-theme-pie)
-   [Maize](https://github.com/BEATREE/typora-maize-theme)
-   [Purple](https://github.com/hliu202/typora-purple-theme)
-   [物理猫-薄荷](https://github.com/sumruler/typora-theme-phycat)

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
wenyan <command> [options]
```

目前最常用的子命令是 `publish`。

## 环境变量配置

部分功能（如发布微信公众号）需要配置以下环境变量：

-   `WECHAT_APP_ID`
-   `WECHAT_APP_SECRET`

### macOS / Linux

临时使用：

```bash
WECHAT_APP_ID=xxx WECHAT_APP_SECRET=yyy wenyan publish "your markdown"
```

永久配置（推荐）：

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

永久设置（在环境变量里添加）：

控制面板 → 系统和安全 → 系统 → 高级系统设置 → 环境变量 → 添加 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。

## 子命令

`publish`

将 Markdown 转换为适配微信公众号的富文本 HTML，并上传到草稿箱。

### 参数

-   `<input-content>`

    Markdown 内容，可以：

    -   直接作为参数传入
    -   通过 stdin 管道输入

### 常用选项

-   `-t`：主题（默认 `default`）
    -   default / orangeheart / rainbow / lapis / pie / maize / purple / phycat
-   `-h`：代码高亮主题（默认 `solarized-light`）
    -   atom-one-dark / atom-one-light / dracula / github-dark / github / monokai / solarized-dark / solarized-light / xcode
-   `--no-mac-style`：关闭代码块 Mac 风格
-   `--no-footnote`：关闭链接转脚注
-   `-f`：指定本地 Markdown 文件路径

## 使用示例

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

## Markdown Frontmatter 说明（必读）

为了正确上传文章，每篇 Markdown 顶部需要包含 frontmatter：

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/xxx/image.jpg
---
```

字段说明：

-   `title` 文章标题（必填）
-   `cover` 文章封面
    -   本地路径或网络图片
    -   如果正文中已有图片，可省略

## 关于图片自动上传

支持以下图片来源：

-   本地路径（如：`/Users/xxx/image.jpg`）
-   网络路径（如：`https://example.com/image.jpg`）

## 微信公众号 IP 白名单

> ⚠️ 重要
>
> 请确保运行文颜的机器 IP 已加入微信公众号后台的 IP 白名单，否则上传接口将调用失败。

配置说明文档：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

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
