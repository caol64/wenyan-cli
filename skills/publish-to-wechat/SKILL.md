---
name: "publish-to-wechat"
description: "AI-ready skill to format and publish Markdown articles to WeChat Official Accounts using Wenyan CLI."
---

# 微信公众号文章发布工具 (WeChat Publisher)

这是一个专门为 AI Agent 设计的技能，用于将标准的 Markdown 文档转换为符合微信公众号排版要求的富文本并直接发布。它集成了自动化样式注入、代码高亮处理以及素材库图片自动上传功能。

## 前置要求

- **环境配置**：必须设置 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 环境变量。
- **依赖工具**：已安装 `wenyan-cli` (`pnpm add -g @wenyan-md/cli`)。

## 核心能力

- **自动化排版**：支持多种内置主题（如 `orangeheart`）和代码高亮方案。
- **智能素材处理**：自动解析 Markdown 中的本地或网络图片，并同步上传至微信素材库。
- **元数据驱动**：通过 YAML Frontmatter 自动配置文章标题、封面、作者和原文链接。
- **高度可定制**：支持自定义 CSS 主题注入，满足个性化品牌视觉。

## AI Agent 指令指南：发布流程规范

### Frontmatter 约束 (必须包含)

文章开头 **必须** 包含以下 YAML 块，否则发布接口将返回错误：

```yaml
---
title: 文章标题
cover: ./cover.jpg # 若缺省则自动取正文第一张图
author: 作者名称 # 可选
source_url: https://example.com/original-article # 可选，原文链接
---
```

### 核心参数说明

- `-f, --file`：**(必填)** Markdown 文件路径。
- `-t, --theme`：排版主题（默认 `default`）。
- `-h, --highlight`：代码高亮主题（默认 `solarized-light`）。
- `--no-mac-style`：禁用代码块 Mac 风格。

## 常用操作示例

### 1. 标准发布 (使用默认配置)
```bash
wenyan publish -f my-article.md
```

### 2. 指定内置主题与高亮发布
```bash
wenyan publish -f article.md -t orangeheart -h solarized-light
```

### 3. 列出所有可用主题
```bash
wenyan theme -l
```

## 故障排除 (Agent 专用)

- **IP 限制错误 (invalid ip)**：提醒用户将当前环境的出口 IP 加入微信后台的“IP 白名单”。
- **AppID/Secret 错误**：检查环境变量是否正确注入。
- **图片上传失败**：确认 Markdown 中的本地图片路径在当前目录中真实存在。
- **发布排版不符预期**：检查 YAML Frontmatter 是否符合规范。
