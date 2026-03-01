## publish：发布文章到微信公众号

`publish` 命令用于将 Markdown 内容转换为微信公众号兼容格式，并上传至公众号草稿箱。

CLI 会自动处理图片上传、HTML 渲染和草稿创建，无需手动操作微信公众号后台。

## 工作流程

执行 `wenyan publish` 时，CLI 自动完成以下步骤：

1. 读取 Markdown 内容（文件 / stdin / 直接输入）
2. 解析 frontmatter（标题、封面等元数据）
3. 自动检测正文和封面中的图片
4. 上传图片到微信公众号素材库
5. 将 Markdown 渲染为微信公众号兼容 HTML
6. 创建公众号草稿
7. 返回发布结果

## 内容输入方式

支持三种输入方式，按需选择。

### 1. 从本地文件读取（推荐）

最常见使用方式：

```bash
wenyan publish -f article.md
```

支持：

* 相对路径
* 绝对路径

例如：

```bash
wenyan publish -f ./posts/article.md
```

### 2. 从标准输入（stdin）读取

适用于管道操作和自动化场景：

```bash
cat article.md | wenyan publish
```

或：

```bash
echo "# 自动生成的文章" | wenyan publish
```

适用于：

* CI/CD
* AI 自动生成内容
* 脚本批量发布

### 3. 直接传入 Markdown 内容

适用于快速发布短内容：

```bash
wenyan publish "# Hello Wenyan\n\n这是一篇测试文章"
```

## Frontmatter 要求

建议在 Markdown 顶部包含 frontmatter：

```md
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
| title      | ✅  | 文章标题              |
| cover      | ❌  | 封面图片（本地路径或网络 URL） |
| author     | ❌  | 作者                |
| source_url | ❌  | 原文链接              |

说明：

* 如果未指定 cover，将自动使用正文第一张图片作为封面
* cover 支持本地路径和网络 URL

## 图片处理机制

CLI 自动识别并上传 Markdown 中的图片。

支持以下路径类型：

| 类型     | 示例                              |
| ------ | ------------------------------- |
| 本地绝对路径 | `/Users/lei/image.png`          |
| 相对路径   | `./assets/image.png`            |
| 网络图片   | `https://example.com/image.png` |

示例：

```md
![](./image.png)

<img src="./image2.png" />
```

CLI 将自动：

* 上传图片到微信素材库
* 替换为微信公众号可访问 URL

无需手动上传图片。

## 使用远程 Server 发布

当本地环境无法直接访问微信公众号 API（如 IP 不在白名单中）时，可使用远程 Server。

```bash
wenyan publish \
  -f article.md \
  --server https://api.example.com \
  --api-key your-api-key
```

工作流程：

1. CLI 读取 Markdown 和图片
2. 上传到 Wenyan Server
3. Server 调用微信公众号 API
4. 返回发布结果

适用于：

* CI/CD
* 云服务器
* 动态 IP 环境
* 团队协作

## 参数说明

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

说明：

¹ 必须满足以下之一：

* 使用 `--file`
* 使用 stdin
* 直接传入 Markdown 内容

² 仅在指定 `--server` 时生效。

## 示例

### 使用主题发布

```bash
wenyan publish \
  -f article.md \
  -t lapis \
  --highlight monokai
```

### 使用自定义主题

```bash
wenyan publish \
  -f article.md \
  --custom-theme ./my-theme.css
```

### 关闭附加样式

```bash
wenyan publish \
  -f article.md \
  --no-mac-style \
  --no-footnote
```

### 使用远程 Server

```bash
wenyan publish \
  -f article.md \
  --server https://api.wenyan.dev \
  --api-key your-api-key
```

### 使用管道发布

```bash
cat article.md | wenyan publish
```

## 常见问题

### 图片上传失败

请检查：

* 图片路径是否正确
* 图片文件是否存在
* 图片格式是否支持（jpg、png、gif）

### 发布失败：invalid ip

说明当前机器 IP 未加入微信公众号白名单。

解决方法：

* 使用远程 Server 模式
* 或将当前 IP 加入微信公众号白名单

### 发布失败：invalid appid or secret

请检查环境变量：

```bash
WECHAT_APP_ID
WECHAT_APP_SECRET
```

## 相关命令

* `wenyan render`：仅渲染 HTML，不发布
* `wenyan serve`：启动 Server
* `wenyan theme`：管理主题
