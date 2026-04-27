## token：令牌管理

管理微信 `access_token`。除了程序自动获取外，还支持手动导入外部生成的 Token。这在多个系统共用一个公众号、且已有统一 Token 管理中心时非常有用。

**查看 Token 缓存位置：**

```bash
wenyan token -l
```

**导入外部 Token：**

通过该方式导入的 Token，其过期时间会被标记为 `-1`。**Wenyan 将不再尝试自动刷新该 Token**，其生命周期完全由外部系统托管。

```bash
# 必须同时提供 appId 和 token
wenyan token -i --app-id <YOUR_APPID> --token <YOUR_TOKEN>
```

### 参数说明

| 参数 | 简写 | 说明 | 必填 |
| :--- | :--- | :--- | :--- |
| `--location` | `-l` | 获取本地 `token.json` 的存储路径 | 否 |
| `--import` | `-i` | 导入外部 Access Token，必须配合 `--app-id` 和 `--token` 使用 | 否 |
| `--app-id` | - | 微信公众号的 AppID | 导入时必填 |
| `--token` | - | 外部生成的有效 Access Token | 导入时必填 |
