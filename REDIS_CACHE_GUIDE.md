# Redis缓存使用指南

## 📋 功能概述

已为项目添加Redis缓存功能，用于缓存用户信息和商品信息，提升查询性能。

## ✅ 已实现的功能

### 1. 用户信息缓存
- **查询缓存**：`findById()` 和 `findByOpenid()` 方法会先查缓存
- **自动更新**：`save()` 方法在保存时会同步更新缓存
- **缓存Key**：
  - `user:{userId}` - 用户ID缓存
  - `user:openid:{openid}` - 用户OpenID缓存

### 2. 商品信息缓存
- **查询缓存**：`findById()` 方法会先查缓存
- **自动更新**：`save()`、`updateProduct()`、`updateStatus()` 方法会同步更新缓存
- **缓存Key**：`product:{productId}`

### 3. 缓存策略
- **查询流程**：缓存 → 数据库 → 写入缓存
- **更新流程**：删除旧缓存 → 更新数据库 → 写入新缓存
- **过期时间**：默认1小时（3600秒）

## 🔧 配置说明

### 环境变量配置（推荐）

```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=your_redis_password  # 如果有密码
export REDIS_DATABASE=0
```

### 配置文件方式

在 `application.yml` 中配置：

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password  # 可选
      database: 0
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0
          max-wait: -1ms
```

## 🚀 部署Redis

### Docker方式（推荐）

```bash
# 启动Redis容器
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# 或带密码
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass your_password
```

### Linux服务器安装

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# CentOS/RHEL
sudo yum install redis

# 启动Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### macOS安装

```bash
brew install redis
brew services start redis
```

## 📊 缓存使用示例

### 用户服务使用

```java
// 查询用户（自动使用缓存）
Optional<User> user = userService.findById(1L);

// 根据OpenID查询（自动使用缓存）
Optional<User> user = userService.findByOpenid("openid123");

// 保存用户（自动更新缓存）
User user = new User();
user.setNickname("测试用户");
userService.save(user);

// 手动删除缓存（如果需要）
userService.evictUserCache(1L);
userService.evictUserCacheByOpenid("openid123");
```

### 商品服务使用

```java
// 查询商品（自动使用缓存）
Optional<Product> product = productService.findById(1L);

// 保存商品（自动更新缓存）
Product product = new Product();
product.setName("测试商品");
productService.save(product);

// 更新商品（自动更新缓存）
Product updateData = new Product();
updateData.setPrice(new BigDecimal("99.00"));
productService.updateProduct(1L, sellerId, updateData);

// 手动删除缓存（如果需要）
productService.evictProductCache(1L);
```

## 🔍 缓存Key规则

| 类型 | Key格式 | 示例 |
|------|---------|------|
| 用户ID | `user:{userId}` | `user:1` |
| 用户OpenID | `user:openid:{openid}` | `user:openid:oABC123` |
| 商品ID | `product:{productId}` | `product:100` |

## 🛠️ 缓存管理

### 查看缓存

```bash
# 连接Redis
redis-cli

# 查看所有用户缓存
KEYS user:*

# 查看所有商品缓存
KEYS product:*

# 查看特定缓存
GET user:1
GET product:100

# 查看缓存过期时间
TTL user:1
```

### 清理缓存

```bash
# 删除特定缓存
DEL user:1
DEL product:100

# 删除所有用户缓存
redis-cli KEYS "user:*" | xargs redis-cli DEL

# 删除所有商品缓存
redis-cli KEYS "product:*" | xargs redis-cli DEL

# 清空所有缓存（谨慎使用）
FLUSHALL
```

## 📈 性能优化

### 缓存命中率监控

可以通过日志查看缓存命中情况：

```
# 缓存命中
DEBUG 从缓存获取用户: ID=1
DEBUG 从缓存获取商品: ID=100

# 缓存未命中
DEBUG 从数据库获取用户并写入缓存: ID=1
DEBUG 从数据库获取商品并写入缓存: ID=100
```

### 缓存预热（可选）

应用启动时可以预热常用数据：

```java
@PostConstruct
public void warmupCache() {
    // 预热热门商品
    List<Product> hotProducts = productService.findHotProducts();
    hotProducts.forEach(product -> {
        String key = cacheService.getProductKey(product.getId());
        cacheService.set(key, product);
    });
}
```

## ⚠️ 注意事项

1. **缓存一致性**：所有更新操作都会自动同步缓存，确保数据一致性
2. **缓存穿透**：如果查询不存在的ID，会缓存null值，避免频繁查询数据库
3. **缓存雪崩**：过期时间设置为1小时，可以降低缓存同时失效的风险
4. **Redis可用性**：如果Redis不可用，会降级到直接查询数据库（异常已捕获）

## 🔄 缓存更新时机

| 操作 | 缓存动作 |
|------|---------|
| 查询用户/商品 | 缓存未命中时写入 |
| 新增用户/商品 | 写入缓存 |
| 更新用户/商品 | 删除旧缓存 → 写入新缓存 |
| 删除操作 | 删除缓存（如果实现删除功能） |

## 🐛 故障排查

### Redis连接失败

如果Redis连接失败，应用会降级到直接查询数据库，不会影响功能，但性能会下降。

检查Redis连接：
```bash
redis-cli ping
# 应该返回 PONG
```

### 缓存未生效

1. 检查Redis配置是否正确
2. 检查Redis服务是否运行
3. 查看应用日志是否有Redis连接错误
4. 确认依赖是否正确添加（`spring-boot-starter-data-redis`）

## 📝 部署检查清单

- [ ] Redis服务已安装并运行
- [ ] Redis配置已添加到 `application.yml` 或环境变量
- [ ] Redis端口（默认6379）已开放（如需要）
- [ ] Redis密码已配置（如需要）
- [ ] 测试缓存功能是否正常工作

