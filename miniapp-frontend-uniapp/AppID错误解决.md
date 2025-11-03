# 微信开发者工具 AppID 错误解决方案

## 问题描述

启动微信开发者工具时出现错误：
- `更改 AppID 失败 touristapppid`
- `Error: tourist appid`

## 原因

uni-app 项目的 `manifest.json` 中 AppID 为空，微信开发者工具使用了测试 AppID（touristappid），导致报错。

## 解决方案

### ✅ 方案1：已修复（推荐）

我已经将 AppID 配置到 `manifest.json` 中：
- `appid`: `wx0af23fd2a82b2553`
- `mp-weixin.appid`: `wx0af23fd2a82b2553`

**下一步操作：**

1. **重新编译项目**（如果使用 HBuilderX）：
   - 在 HBuilderX 中停止运行
   - 重新点击"运行" → "运行到小程序模拟器"

2. **或者重新编译**（如果使用命令行）：
   ```bash
   cd miniapp-frontend-uniapp
   npm run dev:mp-weixin
   ```

3. **在微信开发者工具中**：
   - 删除之前导入的项目
   - 重新导入编译后的 `dist/dev/mp-weixin` 目录
   - 这次应该不会再报 AppID 错误了

### 方案2：在微信开发者工具中手动设置（备选）

如果还有问题，可以在微信开发者工具中手动设置：

1. 打开微信开发者工具
2. 点击右上角的"详情"
3. 在"本地设置"中：
   - 选择"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"（开发时使用）
   - 或者配置正确的 AppID

4. 或者在"项目设置"中：
   - 选择"使用测试号"（如果没有正式 AppID）
   - 或者输入你的正式 AppID

## 注意事项

- **AppID 已配置**：`wx0af23fd2a82b2553`
- **重新编译后生效**：修改 manifest.json 后需要重新编译
- **开发环境**：确保 `urlCheck: false` 已设置（已配置）

## 验证

重新编译并导入后，应该可以正常启动，不会再出现 AppID 错误。

