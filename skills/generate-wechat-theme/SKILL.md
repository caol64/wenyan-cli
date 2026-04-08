---
name: "generate-wechat-theme"
description: "AI-ready skill to design and generate highly customized CSS themes for WeChat Official Accounts."
---

# 微信公众号自定义主题 CSS 生成器 (WeChat CSS Theme Generator)

这是一个专门为 AI Agent 设计的技能，用于根据用户的自然语言需求，生成符合微信公众号排版规范的、高度定制化的 CSS 样式表。此技能仅负责生成 CSS 代码并保存为本地文件。

## 核心能力

- **自然语言转 CSS**：理解用户的视觉需求（如“赛博朋克风”、“带可爱表情的引用块”、“深色代码块”），并转换为精确的 CSS 代码。
- **微信排版规范适配**：严格遵循 `#wenyan` 命名空间约束，确保生成的样式能完美注入并生效于微信公众号的 DOM 结构中。
- **高级排版特效**：支持利用伪元素 (`::before`, `::after`)、渐变背景 (`linear-gradient`)、内联 SVG/Base64 图片等高级 CSS 特性实现复杂视觉效果。

## AI Agent 指令指南：CSS 生成规范

Agent 在生成 CSS 代码时，**必须** 遵循以下严格的规则和约束：

### 1. 强制命名空间约束 (最重要！)

所有生成的 CSS 选择器 **必须** 以 `#wenyan` 开头，中间用空格隔开。任何缺少 `#wenyan` 前缀的样式都将失效。

* ✅ 正确：`#wenyan h1 { color: red; }`
* ❌ 错误：`h1 { color: red; }`

### 2. 字体与字号建议

- **字体族 (font-family)**：严禁主动设置 `font-family`。应当保持默认以适配微信公众号编辑器的系统字体。
- **字号 (font-size)**：建议设定合理的范围（如 `12px - 18px`），以避免排版溢出或阅读困难。

### 3. 支持的 CSS 属性速查字典

| 目标元素 | 对应的 CSS 选择器 | 常用定制属性示例 |
| :--- | :--- | :--- |
| **全局默认样式** | `#wenyan` | `background-image`, `line-height`, `color` |
| **各级标题 (H1-H6)** | `#wenyan h1` 到 `#wenyan h6` | `font-size`, `text-align`, `border-bottom`, `margin` |
| **标题文字本身** | `#wenyan h1 span` | `color`, `font-weight`, `background` (实现文字高亮) |
| **标题装饰 (前后缀)** | `#wenyan h1::before` | `content`, `display`, `width`, `height`, `background-image` |
| **段落文本** | `#wenyan p` | `text-indent`, `letter-spacing`, `color` |
| **引用块整体** | `#wenyan blockquote` | `border-left`, `background-color`, `padding` |
| **代码块外层容器** | `#wenyan pre` | `background-color`, `border-radius`, `padding`, `overflow-x: auto` |
| **代码块内部内容** | `#wenyan pre code` | `color` |
| **分割线** | `#wenyan hr` | `border`, `border-top-style`, `border-color` |
| **超链接** | `#wenyan a` | `color`, `text-decoration`, `border-bottom` |

### 4. 外部资源引用限制 (🚨 极易出错)

- **禁止本地路径**：严禁使用 `url("./bg.png")` 等本地路径。
- **合法引入方式**：
    - **Data URI (推荐)**：`url("data:image/svg+xml;utf8,<svg>...</svg>")`
    - **HTTPS 地址**：`url(https://example.com/bg.jpg)`
- **禁止 Web 字体**：不支持 `@font-face`。只能使用本地系统字体。

## 参考模板 (default.css)

在生成新的主题时，请参考以下 `wenyan-cli` 的默认样式结构：

```css
/* 全局属性 */
#wenyan {
    line-height: 1.75;
    font-size: 16px;
}
/* 全局子元素属性 */
/* 支持分组 */
#wenyan h1,
#wenyan h2,
#wenyan h3,
#wenyan h4,
#wenyan h5,
#wenyan h6,
#wenyan p {
    margin: 1em 0;
}
/* 一级标题 */
#wenyan h1 {
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 1.5em;
}
/* 二级标题 */
#wenyan h2 {
    text-align: center;
    font-size: 1.2em;
    border-bottom: 1px solid #f7f7f7;
    font-weight: bold;
}
/* 列表 */
#wenyan > ul,
#wenyan > ol {
    padding-left: 1rem;
}
#wenyan ul,
#wenyan ol {
    margin-left: 1rem;
    font-size: 0.9rem;
}
/* 图片 */
#wenyan img {
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    display: block;
}
/* 表格 */
#wenyan table {
    border-collapse: collapse;
    margin: 1.4em auto;
    max-width: 100%;
    table-layout: fixed;
    text-align: left;
    overflow: auto;
    display: table;
}
/* 引用块 */
#wenyan blockquote {
    background: #afb8c133;
    border-left: 0.5em solid #ccc;
    margin: 1.5em 0;
    padding: 0.5em 10px;
    font-style: italic;
    font-size: 0.9em;
}
/* 行内代码 */
#wenyan p code {
    color: #ff502c;
    padding: 4px 6px;
    font-size: 0.78em;
}
/* 代码块外围 */
#wenyan pre {
    border-radius: 5px;
    line-height: 2;
    margin: 1em 0.5em;
    padding: .5em;
    box-shadow: rgba(0, 0, 0, 0.55) 0px 1px 5px;
    font-size: 12px;
}
/* 代码块 */
#wenyan pre code {
    display: block;
    overflow-x: auto;
    margin: .5em;
    padding: 0;
}
/* 分割线 */
#wenyan hr {
    border: none;
    border-top: 1px solid #ddd;
    margin-top: 2em;
    margin-bottom: 2em;
}
/* 链接 */
#wenyan a {
    word-wrap: break-word;
    color: #0069c2;
}
```

## 自动化工作流示例 (Agent 执行步骤)

1. **分析需求**：提取关键词（如：深色、科技风），确定主色调。
2. **生成 CSS**：严格按照命名空间约束，生成完整的 CSS 代码。
3. **保存文件**：将生成的 CSS 内容写入当前目录的本地文件（如 `theme.css`）。
4. **后续引导**：提示用户使用 `apply-wechat-custom-theme` 技能进行测试渲染或发布。
