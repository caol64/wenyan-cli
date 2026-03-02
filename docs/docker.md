# Docker 使用指南

如果你不想在本地安装 Node.js，也可以直接使用 Docker 运行 Wenyan CLI 或 Server。

Docker 支持两种运行模式：

* **CLI 模式**：一次性发布文章（推荐用于 CI/CD、本地脚本）
* **Server 模式**：长期运行服务，供远程客户端调用（推荐用于绕过微信公众号 IP 白名单）

## CLI 模式（发布文章）

### 拉取镜像

```bash
docker pull caol64/wenyan-cli
```

### 查看帮助

```bash
docker run --rm caol64/wenyan-cli
```

### 发布文章示例

```bash
docker run --rm \
  --env-file .env.test \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  caol64/wenyan-cli \
  publish -f ./article.md -t lapis
```

### 参数说明

| 参数                              | 说明        |
| ------------------------------- | --------- |
| `--env-file .env`               | 加载微信公众号配置 |
| `-e HOST_FILE_PATH=$(pwd)`      | 指定宿主机路径映射 |
| `-v $(pwd):/mnt/host-downloads` | 挂载本地文件目录  |
| `--rm`                          | 容器运行后自动删除 |

### 工作原理

容器内部路径：

```
/mnt/host-downloads/article.md
```

对应宿主机路径：

```
./article.md
```

CLI 会自动识别并读取文件。

### CI/CD 示例

GitHub Actions：

```yaml
- name: Publish article
  run: |
    docker run --rm \
      --env-file .env \
      -e HOST_FILE_PATH=${{ github.workspace }} \
      -v ${{ github.workspace }}:/mnt/host-downloads \
      caol64/wenyan-cli \
      publish -f ./article.md
```

## Server 模式（推荐）

Server 模式适合：

* 绕过微信公众号 IP 白名单限制
* 提供远程发布 API
* 多客户端共享一个发布服务
* 部署在云服务器

### 启动 Server

```bash
docker run -d \
  --rm \
  --name wenyan-server \
  -p 3000:3000 \
  --env-file .env.test \
  caol64/wenyan-cli \
  serve \
  --api-key testtest
```

### Server 环境变量示例

.env：

```env
WECHAT_APP_ID=xxxx
WECHAT_APP_SECRET=xxxx
WECHAT_REFRESH_TOKEN=xxxx

WENYAN_API_KEY=your-api-key
PORT=3000
```

### 验证 Server

```bash
curl http://localhost:3000/health
```

返回：

```json
{ "status": "ok" }
```

### 使用远程 Server 发布

客户端执行：

```bash
wenyan publish \
  -f article.md \
  --server http://your-server-ip:3000 \
  --api-key your-api-key
```

或 Docker CLI：

```bash
docker run --rm \
  -e HOST_FILE_PATH=$(pwd) \
  -v $(pwd):/mnt/host-downloads \
  caol64/wenyan-cli \
  publish \
  -f ./article.md \
  --server http://host.docker.internal:3000 \
  --api-key your-api-key
```

## Docker Compose（推荐）

CLI：

```yaml
version: "3"

services:
  wenyan:
    image: caol64/wenyan-cli
    env_file:
      - .env
    volumes:
      - .:/mnt/host-downloads
    environment:
      HOST_FILE_PATH: /mnt/host-downloads
```

Server：

```yaml
version: "3"

services:
  wenyan-server:
    image: caol64/wenyan-cli
    command: server
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

启动：

```bash
docker compose up -d
```
