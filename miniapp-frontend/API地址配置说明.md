# API 地址配置说明

## 配置位置

配置文件：`app.js`

```javascript
const ENV_CONFIG = {
  development: 'http://localhost:8081',
  production: "https://fxyw.work/miniapp-backend",  // 或 'https://fxyw.work'
};
```

## 如何确定正确的地址

### 方法1：测试访问

在浏览器中测试以下地址，看哪个能正常返回：

1. **测试带路径的地址：**
   ```
   https://fxyw.work/miniapp-backend/api/health
   ```
   或
   ```
   https://fxyw.work/miniapp-backend/swagger-ui.html
   ```

2. **测试不带路径的地址：**
   ```
   https://fxyw.work/api/health
   ```
   或
   ```
   https://fxyw.work/swagger-ui.html
   ```

**能正常访问的地址就是正确的配置。**

### 方法2：检查 Nginx 配置

查看服务器的 Nginx 配置文件（通常在 `/etc/nginx/nginx.conf` 或 `/etc/nginx/sites-available/`）：

#### 如果配置了路径转发（需要加 `/miniapp-backend`）：

```nginx
server {
    listen 80;
    server_name fxyw.work;

    location /miniapp-backend {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**前端配置：** `https://fxyw.work/miniapp-backend`

#### 如果配置了根路径转发（不需要加）：

```nginx
server {
    listen 80;
    server_name fxyw.work;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**前端配置：** `https://fxyw.work`

## 推荐配置

### 推荐使用路径转发方式（更灵活）

**Nginx 配置：**
```nginx
server {
    listen 80;
    server_name fxyw.work;

    # 前端静态资源
    location / {
        root /var/www/html;
        index index.html;
    }

    # 后端 API（路径转发）
    location /miniapp-backend {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持（如果需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**前端配置：** `https://fxyw.work/miniapp-backend`

## 注意事项

1. **确保后端服务正在运行：**
   ```bash
   sudo systemctl status miniapp-backend
   ```

2. **确保 Nginx 配置生效：**
   ```bash
   sudo nginx -t  # 检查配置
   sudo systemctl reload nginx  # 重新加载
   ```

3. **检查防火墙：**
   确保 80 和 443 端口开放

4. **SSL 证书：**
   如果使用 HTTPS，确保已配置 SSL 证书

## 常见问题

### Q: 为什么请求返回 404？

A: 检查：
1. Nginx 配置是否正确
2. 后端服务是否运行
3. 路径是否正确（是否包含 `/miniapp-backend`）

### Q: 为什么请求返回 502？

A: 检查：
1. 后端服务是否正常运行
2. `proxy_pass` 地址是否正确（`http://localhost:8081`）

### Q: 如何测试配置？

A: 使用 curl 测试：
```bash
# 测试带路径
curl https://fxyw.work/miniapp-backend/api/health

# 测试不带路径
curl https://fxyw.work/api/health
```

