<div align="center">
    <img alt = "logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" />
</div>

# 文颜 CLI

[![npm](https://img.shields.io/npm/v/@wenyan-md/cli)](https://www.npmjs.com/package/@wenyan-md/cli)
[![License](https://img.shields.io/github/license/caol64/wenyan-cli)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fcli)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-cli?style=social)](https://github.com/caol64/wenyan-cli)

「文颜」是一款多平台排版美化工具，让你将 Markdown 一键发布至微信公众号、知乎、今日头条等主流写作平台。

**文颜**现已推出多个版本：

* [macOS App Store 版](https://github.com/caol64/wenyan) - MAC 桌面应用
* [跨平台版本](https://github.com/caol64/wenyan-pc) - Windows/Linux 跨平台桌面应用
* [CLI 版本](https://github.com/caol64/wenyan-cli) - CI/CD 或脚本自动化发布公众号文章
* [MCP 版本](https://github.com/caol64/wenyan-mcp) - 让 AI 自动发布公众号文章
* [嵌入版本](https://github.com/caol64/wenyan-core) - 将文颜的核心功能嵌入 Node 或者 Web 项目

本项目是 **文颜的 CLI 版本**。

## 功能

* 使用内置主题对 Markdown 内容排版
* 支持图片自动上传
* 支持数学公式渲染
* 一键发布文章到微信公众号草稿箱

## 主题效果

👉 [内置主题预览](https://yuzhi.tech/docs/wenyan/theme)

文颜采用了多个开源的 Typora 主题，在此向各位作者表示感谢：

- [Orange Heart](https://github.com/evgo2017/typora-theme-orange-heart)
- [Rainbow](https://github.com/thezbm/typora-theme-rainbow)
- [Lapis](https://github.com/YiNNx/typora-theme-lapis)
- [Pie](https://github.com/kevinzhao2233/typora-theme-pie)
- [Maize](https://github.com/BEATREE/typora-maize-theme)
- [Purple](https://github.com/hliu202/typora-purple-theme)
- [物理猫-薄荷](https://github.com/sumruler/typora-theme-phycat)

## 安装

```
npm install -g @wenyan-md/cli
```

## 基本用法

主命令为：

```bash
wenyan <command> [options]
```

## 环境变量

某些功能（如发布到微信公众号）需要配置以下环境变量：

* `WECHAT_APP_ID`
* `WECHAT_APP_SECRET`

### macOS / Linux

可在命令前临时设置：

```bash
WECHAT_APP_ID=xxx WECHAT_APP_SECRET=yyy wenyan publish "your markdown"
```

或在 `~/.bashrc` / `~/.zshrc` 中永久添加：

```bash
export WECHAT_APP_ID=xxx
export WECHAT_APP_SECRET=yyy
```

### Windows (PowerShell)

临时设置：

```powershell
$env:WECHAT_APP_ID="xxx"; $env:WECHAT_APP_SECRET="yyy"; wenyan publish "your markdown"
```

永久设置（在环境变量里添加）：

控制面板 → 系统和安全 → 系统 → 高级系统设置 → 环境变量 → 添加 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。

## 子命令

`publish`

将 Markdown 转换为适配微信公众号的富文本 HTML 并上传到公众号。

### 参数

- `<input-content>`，要转换的 Markdown 内容。可直接作为参数传入，或通过管道/重定向从 `stdin` 读取

### 选项

- `-t`，主题id，默认`default`
  - default
  - orangeheart
  - rainbow
  - lapis
  - pie
  - maize
  - purple
  - phycat
- `-h`，代码高亮主题，默认`solarized-light`
  - atom-one-dark
  - atom-one-light
  - dracula
  - github-dark
  - github
  - monokai
  - solarized-dark
  - solarized-light
  - xcode
- 代码块默认使用 Mac 风格，如要关闭：`--no-mac-style`
- 链接默认转脚注，如要关闭：`--no-footnote`

## 示例

直接传入内容：

```bash
wenyan publish "# Hello, Wenyan" -t lapis -h solarized-light
```

从文件读取：

```bash
cat example.md | wenyan publish -t lapis -h solarized-light --no-mac-style
```

## 微信公众号 IP 白名单

请务必将服务器 IP 加入公众号平台的 IP 白名单，以确保上传接口调用成功。
详细配置说明请参考：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

## 配置说明（Frontmatter）

为了可以正确上传文章，需要在每一篇 Markdown 文章的开头添加一段`frontmatter`，提供`title`、`cover`两个字段：

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/lei/Downloads/result_image.jpg
---
```

* `title` 是文章标题，必填。
* `cover` 是文章封面，支持本地路径和网络图片：

  * 如果正文有至少一张图片，可省略，此时将使用其中一张作为封面；
  * 如果正文无图片，则必须提供 cover。

## 关于图片自动上传

* 支持图片路径：

  * 本地路径（如：`/Users/lei/Downloads/result_image.jpg`）
  * 网络路径（如：`https://example.com/image.jpg`）

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

如果您觉得不错，可以给我家猫咪买点罐头吃。[喂猫❤️](https://yuzhi.tech/sponsor)

## License

Apache License Version 2.0
