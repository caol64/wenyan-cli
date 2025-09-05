<div align="center">
    <img alt = "logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" />
</div>

# 文颜 CLI

## Overview

文颜的`CLI`工具，支持将 Markdown 格式的文章发布至微信公众号草稿箱，并使用与 [文颜](https://yuzhi.tech/wenyan) 相同的主题系统进行排版。

支持的主题效果预览：

- [内置主题](https://yuzhi.tech/docs/wenyan/theme)

## Features

- 使用内置主题对 Markdown 内容排版
- 发布文章到微信公众号草稿箱
- 自动上传本地或网络图片

---

## 安装

```
npm install -g @wenyan-md/cli
```

## 基本用法

主命令为：

```bash
wenyan <command> [options]
```

### 子命令

`publish`

将 Markdown 转换为适配微信公众号的富文本 HTML 并上传到公众号。

### 参数

- `<input-content>`，要转换的 Markdown 内容。可直接作为参数传入，或通过管道/重定向从 `stdin` 读取

### 选项

- `-t`，主题id，默认`default`
- `-h`，代码高亮主题，默认`solarized-light`
- `-m`，使用 Mac 风格的代码块，默认启用，如要关闭：`--no-mac-style`

### 示例

直接传入内容：

```bash
wenyan publish "# Hello, Wenyan" -t lapis -h solarized-light
```

从文件读取：

```bash
cat example.md | wenyan publish -t lapis -h solarized-light --no-mac-style
```

---

## 微信公众号 IP 白名单

请务必将服务器 IP 加入公众号平台的 IP 白名单，以确保上传接口调用成功。
详细配置说明请参考：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

---

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

---

## 关于图片自动上传

* 支持图片路径：

  * 本地路径（如：`/Users/lei/Downloads/result_image.jpg`）
  * 网络路径（如：`https://example.com/image.jpg`）

---

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

---

## 赞助

如果您觉得不错，可以给我家猫咪买点罐头吃。[喂猫❤️](https://yuzhi.tech/sponsor)

---

## License

Apache License Version 2.0
