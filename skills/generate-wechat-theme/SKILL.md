---
name: "generate-wechat-theme"
description: "AI-ready skill to design and generate highly customized CSS themes for WeChat Official Accounts."
---

# 微信公众号自定义主题 CSS 生成器 (WeChat CSS Theme Generator)

这是一个专门为 AI Agent 设计的技能，用于根据用户的自然语言需求，生成符合微信公众号排版规范的、高度定制化的 CSS 样式表。此技能仅负责生成 CSS 代码并保存为本地文件，不涉及文章的实际发布。

## 核心能力

-   **自然语言转 CSS**：理解用户的视觉需求（如“赛博朋克风”、“带可爱表情的引用块”、“深色代码块”），并转换为精确的 CSS 代码。
-   **微信排版规范适配**：严格遵循 `#wenyan` 命名空间约束，确保生成的样式能完美注入并生效于微信公众号的 DOM 结构中。
-   **高级排版特效**：支持利用伪元素 (`::before`, `::after`)、渐变背景 (`linear-gradient`)、内联 SVG/Base64 图片等高级 CSS 特性实现复杂视觉效果。

## AI Agent 指令指南：CSS 生成规范

Agent 在生成 CSS 代码时，**必须且只能**遵循以下严格的规则和约束：

### 1. 强制命名空间约束 (最重要！)

所有生成的 CSS 选择器 **必须且只能** 以 `#wenyan` 开头，中间用空格隔开。任何缺少 `#wenyan` 前缀的样式都将失效并可能污染全局。

*   ✅ 正确：`#wenyan h1 { color: red; }`
*   ❌ 错误：`h1 { color: red; }`
*   ❌ 错误：`.my-custom-title { color: red; }`

### 2. 谨慎设置字体相关属性

- **字体族（font-family）**：严禁主动设置`font-family`。应当保持默认以适配微信公众号编辑器的系统字体，确保在不同移动终端（iOS/Android）下的显示兼容性。

- **字号（font-size）**：支持通过主题配置或用户自定义修改`font-size`，但建议设定合理的缩放范围（如`12px - 18px`），以避免排版溢出或阅读困难。

### 3. 支持的 CSS 属性速查字典

Agent 只能针对以下特定的选择器字典进行样式定制：

| 目标元素 | 对应的 CSS 选择器 | 常用定制属性示例 |
| :--- | :--- | :--- |
| **全局默认样式** | `#wenyan` | `background-image`, `line-height`, `color` |
| **各级标题 (H1-H6)** | `#wenyan h1` 到 `#wenyan h6` | `font-size`, `text-align`, `border-bottom`, `margin` |
| **标题文字本身** | `#wenyan h1 span` | `color`, `font-weight`, `background` (实现文字高亮) |
| **标题装饰 (前后缀)** | `#wenyan h1::before` 等 | `content`, `display`, `width`, `height`, `background-image` |
| **段落文本** | `#wenyan p` | `text-indent`, `letter-spacing`, `color` |
| **列表整体** | `#wenyan ul`, `#wenyan ol` | `padding-left`, `list-style-type` |
| **列表项** | `#wenyan li` | `margin-bottom`, `line-height` |
| **图片** | `#wenyan img` | `border-radius`, `box-shadow`, `max-width` |
| **表格整体容器** | `#wenyan table` | `border-collapse`, `width`, `table-layout: fixed` |
| **表头** | `#wenyan table th` | `background-color`, `border` |
| **单元格** | `#wenyan table td` | `border`, `padding`, `text-align` |
| **斑马线条纹(偶数行)** | `#wenyan table tr:nth-child(even)` | `background-color` |
| **引用块整体** | `#wenyan blockquote` | `border-left`, `background-color`, `padding` |
| **引用块装饰** | `#wenyan blockquote::before` | `content` (如插入 emoji "💡"), `font-size` |
| **行内代码** | `#wenyan p code` | `color`, `background-color`, `border-radius` |
| **代码块外层容器** | `#wenyan pre` | `background-color`, `border-radius`, `padding`, `overflow-x: auto` |
| **代码块内部内容** | `#wenyan pre code` | `color` |
| **分割线** | `#wenyan hr` | `border`, `border-top-style`, `border-color` |
| **超链接** | `#wenyan a` | `color`, `text-decoration`, `border-bottom` |
| **脚注上标 (链接旁)** | `#wenyan .footnote` | `color`, `vertical-align: super` |
| **文末脚注区域整体**| `#wenyan #footnotes` | `margin-top`, `border-top` |
| **文末脚注单行** | `#wenyan #footnotes p` | `display: flex`, `font-size` |
| **文末脚注编号** | `#wenyan .footnote-num` | `width`, `color` |
| **文末脚注文字** | `#wenyan .footnote-txt` | `width`, `word-break: break-all` |

### 3. 全局变量定义规范

如果需要定义全局颜色、字体等变量，必须在 `:root` 中定义，然后在 `#wenyan` 内调用。

```css
/* ✅ 推荐的变量定义方式 */
:root {
    --theme-primary: #3b82f6;
    --theme-bg: #f8fafc;
    --font-size: 16px;
    --block-shadow: 0.15em 0.15em 0.5em rgb(150, 150, 150);
}

#wenyan {
    font-size: var(--font-size);
    background-color: var(--theme-bg);
}

#wenyan h2 {
    color: var(--theme-primary);
}

#wenyan pre code {
    box-shadow: var(--block-shadow);
}
```

### 4. 外部资源与图片引入的硬性限制 (🚨 极易出错)

微信公众号底层编辑器环境有着严格的资源限制，Agent 在处理背景图、图标或自定义字体时，必须遵守以下三条铁律：

1.  **绝对禁止使用本地相对路径图片**：例如 `background-image: url("./bg.png")` 永远不会生效。
2.  **仅允许三种合法的图片引入方式**：
    *   **直接嵌入的 SVG 代码 (强烈推荐，最稳定)**：`url("data:image/svg+xml;utf8,<svg>...</svg>")`
    *   **Base64 编码的图片**：`url(data:image/png;base64,iVBORw0KGgo...)`
    *   **绝对网络 HTTPS 地址**：`url(https://example.com/bg.jpg)`
3.  **绝对禁止引入 Web 字体**：不支持使用 `@font-face` 或 `url()` 引入外部字体文件（如 Google Fonts）。只能使用用户操作系统已安装的本地字体（如 "微软雅黑", "PingFang SC", Arial 等）。

### 5. 常见高级特效范例

*   **带前缀 Emoji 的极简引用块**
    ```css
    #wenyan blockquote {
        background-color: #f3f4f6;
        padding: 12px 16px;
        border-radius: 8px;
        border: none;
    }
    #wenyan blockquote::before {
        display: block;
        content: "💡";
        font-size: 1.5em;
        margin-bottom: 4px;
    }
    ```

*   **带有 SVG 装饰的二级标题**
    ```css
    #wenyan h2::before {
        display: inline-block;
        content: "";
        width: 24px;
        height: 24px;
        /* 这里必须是完整的 data URI 或 HTTPS 链接 */
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'><path d='M12 2L2 22h20L12 2z'/></svg>");
        background-repeat: no-repeat;
        background-size: contain;
        vertical-align: middle;
        margin-right: 8px;
    }
    ```

## 自动化工作流示例 (Agent 执行步骤)

当用户提出：“帮我设计一个深色科技风的排版样式”时，Agent 应执行以下标准 SOP：

1.  **分析需求**：提取关键词（深色、科技风），确定主要颜色（如黑色背景、荧光绿/蓝高亮）。
2.  **生成 CSS**：严格按照上述字典和命名空间约束，生成完整的 CSS 代码字符串。
3.  **保存文件**：将生成的 CSS 字符串写入当前工作目录的本地文件中。
    ```bash
    # 将生成的 CSS 内容写入文件
    echo ":root { --tech-green: #10b981; } #wenyan { background-color: #111827; color: #e5e7eb; } #wenyan h1 { color: var(--tech-green); border-bottom: 2px dashed var(--tech-green); }" > cyber-dark-theme.css
    ```
4.  **交接任务**：告知用户 CSS 文件已生成，并建议其使用 `apply-wechat-custom-theme` 技能进行测试渲染或发布。
```
