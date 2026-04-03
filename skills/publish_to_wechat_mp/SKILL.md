# wenyan-cli 发布指南

## 准备工作

你需要准备一篇 Markdown 格式的文章，包含必要的 frontmatter（标题、封面等元数据）。如果文章内包含图片，确保图片路径正确且可访问，CLI 会自动上传图片到微信公众号素材库。

## 安装 wenyan-cli

```bash
npm install -g @wenyan-md/cli
```

确认安装成功：

```bash
wenyan --version
```

## 发布文章

发布文章的基本命令如下：

```bash
wenyan publish [options]
```

### 命令参数说明

| 参数             | 简写 | 说明                 | 必填 | 默认值             |
| -------------- | -- | ------------------ | -- | --------------- |
| --file         | -f | Markdown 文件路径      | 否¹ | -               |
| --theme        | -t | 排版主题               | 否  | default         |
| --highlight    | -h | 代码高亮主题             | 否  | solarized-light |
| --custom-theme | -c | 自定义主题 CSS（本地或 URL） | 否  | -               |
| --no-mac-style | -  | 禁用代码块 Mac 风格       | 否  | 启用              |
| --no-footnote  | -  | 禁用脚注转换             | 否  | 启用              |
| --server       | -  | Wenyan Server 地址   | 否  | -               |
| --api-key      | -  | Server API Key     | 否² | -               |
| --help         | -  | 查看帮助               | 否  | -               |

### 从本地文件读取并发布

```bash
wenyan publish -f article.md
```

### 指定排版主题

```bash
wenyan publish -f article.md -t orangeheart
```

### 指定代码高亮主题

```bash
wenyan publish -f article.md -h solarized-light
```

## 主题管理

主题管理的基本命令如下：

```bash
wenyan theme [options]
```

### 命令参数说明
| 参数              | 简写 | 说明                                                                 | 必填 | 默认值       |
|-------------------|------|----------------------------------------------------------------------|------|--------------|
| --list            | -l   | 列出所有可用主题（内置 + 自定义）                  | 否  | -            |
| --add            | -   | 触发添加自定义主题操作                   | 否（添加主题时必填）  | -            |
| --name            | -   | 自定义主题名称（唯一标识）                  | 是（仅 `--add` 生效时）  | -            |
| --path            | -   | 主题 CSS 文件路径（本地绝对 / 相对路径、网络 URL）                   |  是（仅 `--add` 生效时）  | -            |
| --rm            | -   | 删除指定名称的自定义主题                  | 否（删除主题时必填）  | -            |


###  列出可使用的主题

```bash
wenyan theme -l
```

## Frontmatter 要求

必须在 Markdown 顶部包含一段 frontmatter：

```
---
title: 文章标题
cover: ./cover.jpg
author: 作者名称
source_url: https://example.com
---
```

字段说明：

| 字段         | 必填 | 说明                |
| ---------- | -- | ----------------- |
| title      | 是  | 文章标题              |
| cover      | 否  | 封面图片（本地路径或网络 URL） |
| author     | 否  | 作者                |
| source_url | 否  | 原文链接              |

说明：

* 如果未指定 cover，将自动使用正文第一张图片作为封面
* cover 支持本地路径和网络 URL

## 常见问题

### 图片上传失败

请检查：

* 图片路径是否正确
* 图片文件是否存在
* 图片格式是否支持（jpg、png、gif）

### 发布失败：invalid ip

说明当前机器 IP 未加入微信公众号白名单。

解决方法：

登录微信公众号后台，将当前 IP 加入微信公众号白名单。

### 发布失败：invalid appid or secret

请在环境变量中设置以下变量：

```bash
WECHAT_APP_ID
WECHAT_APP_SECRET
```
