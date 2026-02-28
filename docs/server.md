# wenyan-cli server 模式文档

## API 接口设计

所有的内容接口采用流式上传（支持 10MB），安全且高效。如果设置了鉴权，请在 Header 中携带 `x-api-key: your-api-key`。

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

### 2. 文件/图片上传接口

支持上传图片和 Markdown 文件。上传后，文件将被安全地存储在服务器临时目录（10分钟后自动回收），并返回供下一步使用的 `fileId`。

```bash
# 上传 Markdown 或 图片
curl -X POST http://localhost:3000/upload \
  -H "x-api-key: my-secret-key" \
  -F "file=@/path/to/article.md"
```

响应示例：

```json
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000.md",
    "originalFilename": "article.md",
    "mimetype": "text/markdown",
    "size": 1024
  }
}
```

### 3. 远程发布接口

使用上传阶段获得的 `fileId` 触发服务端的排版渲染和微信发布流程。服务端会自动读取暂存的文件内容并发布。

```bash
curl -X POST http://localhost:3000/publish \
  -H "x-api-key: my-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "550e8400-e29b-41d4-a716-446655440000.md",
    "theme": "default",
    "highlight": "solarized-light",
    "macStyle": true
  }'
```
