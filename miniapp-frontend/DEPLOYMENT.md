# 小程序部署快速指南

## 🚀 快速部署步骤

### 1. 配置后端API地址

编辑 `app.js`，修改生产环境地址：

```javascript
const CURRENT_ENV = 'production';  // 改为 production
const ENV_CONFIG = {
  production: 'https://your-domain.com'  // 改为你的服务器地址
};
```

### 2. 配置小程序AppID

编辑 `project.config.json`：

```json
{
  "appid": "你的小程序AppID"
}
```

### 3. 配置服务器域名

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 开发 → 开发管理 → 开发设置 → 服务器域名
3. 添加你的服务器域名或IP

### 4. 上传代码

1. 打开微信开发者工具
2. 点击 **上传**
3. 填写版本号和备注
4. 上传

### 5. 提交审核

1. 微信公众平台 → 版本管理
2. 找到上传的版本
3. 点击 **提交审核**
4. 填写审核信息

### 6. 发布

审核通过后，点击 **全量发布**

## 📋 部署检查清单

- [ ] baseURL已配置为生产环境地址
- [ ] AppID已配置正确
- [ ] 服务器域名已配置
- [ ] 代码已编译无错误
- [ ] 功能测试通过
- [ ] 代码已上传
- [ ] 已提交审核

## 🔧 环境切换

开发时：
```javascript
const CURRENT_ENV = 'development';
```

发布时：
```javascript
const CURRENT_ENV = 'production';
```

