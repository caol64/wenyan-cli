<div align="center">
  <img alt="logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" width="120" />
</div>

# wenyan-cli (Docker)

**Render Markdown to beautifully styled articles and publish to content platforms — powered by Docker.**

> This image bundles **wenyan CLI** and all required runtime dependencies.
> No local Node.js or npm environment required.

## Quick Start

### Pull image

```bash
docker pull caol64/wenyan-cli
```

### Show help

```bash
docker run --rm caol64/wenyan-cli --help
```

## Basic Usage

Render and publish a Markdown file to WeChat Official Account draft box:

```bash
docker run --rm \
  --env-file .env \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  caol64/wenyan-cli \
  publish -f ./article.md
```

Render Markdown content directly:

```bash
docker run --rm caol64/wenyan-cli \
  render "# Hello Wenyan"
```

## Working with Local Files (Recommended)

When using local Markdown or image files, mount the current directory:

```bash
docker run --rm \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  caol64/wenyan-cli \
  publish -f ./example.md
```

**How it works:**

| Path                  | Description                   |
| --------------------- | ----------------------------- |
| `HOST_FILE_PATH`      | Absolute path on host machine |
| `/mnt/host-downloads` | Mounted path inside container |

All file paths in Markdown (cover / images) should reference host paths.

## Input Methods

`publish` supports **exactly one** input source:

-   `-f <file>` — read Markdown from local file
-   `<input-content>` — inline Markdown string
-   `stdin` — pipe from another command

Examples:

```bash
cat article.md | docker run --rm -i caol64/wenyan-cli render
```

```bash
docker run --rm caol64/wenyan-cli render "# Title"
```

## Options

Commonly used options:

-   `-t, --theme` — theme ID (default: `default`)
-   `-h, --highlight` — code highlight theme
-   `--no-mac-style` — disable macOS-style code blocks
-   `--no-footnote` — disable link-to-footnote conversion

## Markdown Frontmatter (Required)

Each Markdown file must include frontmatter:

```md
---
title: My Article Title
cover: /absolute/path/to/cover.jpg
---
```

-   `title` — article title (required)
-   `cover` — optional cover image (local or remote)

## Environment Variables

Publishing to WeChat requires:

-   `WECHAT_APP_ID`
-   `WECHAT_APP_SECRET`

Recommended usage with `.env` file:

```env
WECHAT_APP_ID=xxx
WECHAT_APP_SECRET=yyy
```

## Image Details

-   Entrypoint: `wenyan`
-   Runtime: Node.js (bundled)
-   Architecture: `linux/amd64`, `linux/arm64`

## License

Apache License Version 2.0

### Tip

For frequent usage, create an alias:

```bash
alias wenyan='docker run --rm \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  caol64/wenyan-cli'
```

Then use it like a native CLI:

```bash
wenyan publish -f article.md
```
