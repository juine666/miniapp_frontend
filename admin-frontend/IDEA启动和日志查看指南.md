# admin-frontend 项目 - IDEA 启动和日志查看指南

## 📋 项目信息

- **项目类型**：React + Vite 前端项目
- **开发服务器**：Vite
- **默认端口**：5173
- **访问地址**：http://localhost:5173

## 🚀 在 IDEA 中启动项目

### 方法一：使用 IDEA 终端（推荐）

#### 1. 打开终端
- 在 IDEA 底部点击 `Terminal` 标签
- 或使用快捷键：`Alt+F12` (Windows/Linux) 或 `Option+F12` (Mac)
- 或菜单：`View` → `Tool Windows` → `Terminal`

#### 2. 进入项目目录
```bash
cd admin-frontend
```

#### 3. 安装依赖（首次运行）
```bash
npm install
```

#### 4. 启动开发服务器
```bash
npm run dev
```

#### 5. 查看启动信息
启动成功后，终端会显示：
```
VITE v5.4.21  ready in 910 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 方法二：配置 IDEA 运行配置

#### 1. 创建运行配置
1. 点击 `Run` → `Edit Configurations...`
2. 点击左上角的 `+` 号
3. 选择 `npm`
4. 配置如下：
   - **Name**: `admin-frontend dev`
   - **package.json**: 选择 `admin-frontend/package.json`
   - **Command**: `run`
   - **Scripts**: `dev`
   - **Working directory**: `$PROJECT_DIR$/admin-frontend`

#### 2. 启动项目
- 点击运行按钮 ▶️
- 或使用快捷键：`Shift+F10` (Windows/Linux) 或 `Ctrl+R` (Mac)

### 方法三：使用 Maven/Gradle 工具窗口（如果配置了）

如果项目根目录有 `package.json`，可以在 Maven 工具窗口中：
1. 打开右侧边栏的 `Maven` 或 `Gradle` 工具窗口
2. 找到 `admin-frontend` → `Lifecycle` → `npm`
3. 双击 `dev` 或右键选择 `Run`

## 📊 查看日志

### 1. IDEA 终端日志（开发服务器日志）

#### 查看位置
- **Terminal 窗口**：项目启动后，在 IDEA 底部的 `Terminal` 窗口
- **Run 窗口**：如果使用运行配置，在 `Run` 窗口中查看

#### 日志内容
- ✅ Vite 开发服务器启动信息
- ✅ 热模块更新（HMR）日志
- ✅ 编译错误和警告
- ✅ 网络请求日志（如果配置了）

#### 日志示例
```
VITE v5.4.21  ready in 910 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
3:15:47 PM [vite] hmr update /src/auth/AuthContext.jsx
3:15:47 PM [vite] hmr update /src/pages/Users.jsx
```

#### 使用技巧
1. **搜索日志**：
   - 在 Terminal 中按 `Ctrl+F` (Windows/Linux) 或 `Cmd+F` (Mac)
   - 输入关键词搜索

2. **清空日志**：
   - 右键 Terminal → `Clear All`
   - 或使用快捷键：`Ctrl+L` (Windows/Linux) 或 `Cmd+K` (Mac)

3. **复制日志**：
   - 选中日志文本，右键选择 `Copy`
   - 或使用快捷键：`Ctrl+C` (Windows/Linux) 或 `Cmd+C` (Mac)

### 2. 浏览器控制台日志（应用运行时日志）

#### 查看位置
1. **打开浏览器**：访问 http://localhost:5173
2. **打开开发者工具**：
   - Chrome/Edge: `F12` 或 `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
   - Firefox: `F12` 或 `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
   - Safari: `Cmd+Option+I` (Mac)

3. **查看 Console 标签**：
   - 点击 `Console` 标签
   - 可以看到所有 `console.log()`, `console.error()`, `console.warn()` 等日志

#### 日志类型
- **console.log()** - 普通日志（蓝色/黑色）
- **console.info()** - 信息日志（蓝色）
- **console.warn()** - 警告日志（黄色）
- **console.error()** - 错误日志（红色）
- **console.debug()** - 调试日志（灰色）

#### 使用技巧
1. **过滤日志**：
   - 点击 Console 顶部的过滤器图标
   - 选择日志级别（All/Errors/Warnings/Info/Verbose）

2. **搜索日志**：
   - 在 Console 中按 `Ctrl+F` (Windows/Linux) 或 `Cmd+F` (Mac)
   - 输入关键词搜索

3. **清空日志**：
   - 点击 Console 右侧的清空图标 🗑️
   - 或右键选择 `Clear console`

4. **保存日志**：
   - 右键 Console → `Save as...`
   - 或使用快捷键：`Ctrl+S` (Windows/Linux) / `Cmd+S` (Mac)

### 3. 浏览器网络日志（API 请求日志）

#### 查看位置
1. **打开浏览器开发者工具**：`F12`
2. **点击 Network 标签**
3. **刷新页面或执行操作**

#### 日志内容
- ✅ 所有 HTTP 请求（API 调用）
- ✅ 请求方法、URL、状态码
- ✅ 请求头和响应头
- ✅ 请求参数和响应数据
- ✅ 请求耗时

#### 使用技巧
1. **过滤请求**：
   - 在 Network 顶部的过滤器中选择类型（XHR/Fetch/JS/CSS 等）
   - 或使用搜索框输入 URL 关键词

2. **查看请求详情**：
   - 点击请求名称
   - 查看 `Headers`、`Payload`、`Response` 等标签

3. **复制请求**：
   - 右键请求 → `Copy` → `Copy as cURL` 或 `Copy as fetch`

### 4. React DevTools（组件调试）

#### 安装
1. **Chrome/Edge**：
   - 访问：https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
   - 点击 "添加到 Chrome"

2. **Firefox**：
   - 访问：https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
   - 点击 "添加到 Firefox"

#### 使用
1. **打开浏览器开发者工具**：`F12`
2. **查看 Components 标签**：
   - 可以看到 React 组件树
   - 查看组件状态和 props
   - 修改组件状态进行调试

3. **查看 Profiler 标签**：
   - 记录组件渲染性能
   - 分析性能瓶颈

## 🔍 常见问题排查

### 1. 启动失败

**检查点**：
- ✅ Node.js 是否已安装（`node --version`）
- ✅ npm 是否已安装（`npm --version`）
- ✅ 依赖是否已安装（`npm install`）
- ✅ 端口 5173 是否被占用

**查看错误日志**：
- 在 IDEA Terminal 中查看错误信息
- 或查看浏览器控制台的错误信息

### 2. 页面无法访问

**检查点**：
- ✅ 开发服务器是否已启动
- ✅ 端口是否正确（默认 5173）
- ✅ 浏览器地址是否正确（http://localhost:5173）

**查看日志**：
- 在 IDEA Terminal 中查看 Vite 启动日志
- 在浏览器控制台查看错误信息

### 3. API 请求失败

**检查点**：
- ✅ 后端服务是否已启动（默认端口 8081）
- ✅ API 地址是否正确（http://localhost:8080）
- ✅ 网络请求是否被拦截

**查看日志**：
- 在浏览器 Network 标签中查看请求详情
- 在浏览器 Console 中查看错误信息
- 在代码中查看 `AuthContext.jsx` 中的错误处理

### 4. 热更新不工作

**检查点**：
- ✅ Vite 开发服务器是否正常运行
- ✅ 文件是否保存
- ✅ 浏览器是否支持 HMR

**查看日志**：
- 在 IDEA Terminal 中查看 HMR 更新日志
- 在浏览器控制台查看错误信息

## 📝 快速参考

### 启动项目
```bash
cd admin-frontend
npm install  # 首次运行
npm run dev
```

### 查看日志
```
1. IDEA Terminal（开发服务器日志）
2. 浏览器 Console（应用运行时日志）
3. 浏览器 Network（API 请求日志）
```

### 停止项目
```
在 Terminal 中按 Ctrl+C
或
在 Run 窗口中点击停止按钮 ⏹️
```

### 重启项目
```
停止后重新运行 npm run dev
或
在 Run 窗口中点击重启按钮 🔄
```

## 🎯 最佳实践

1. **开发时**：
   - 使用 IDEA Terminal 查看开发服务器日志
   - 使用浏览器 Console 查看应用日志
   - 使用浏览器 Network 查看 API 请求

2. **调试时**：
   - 在代码中添加 `console.log()` 语句
   - 使用 React DevTools 调试组件
   - 使用浏览器断点调试

3. **排查问题**：
   - 先查看浏览器 Console 的错误信息
   - 再查看 Network 标签的请求详情
   - 最后查看 IDEA Terminal 的编译错误

4. **性能优化**：
   - 使用 React DevTools Profiler 分析性能
   - 使用浏览器 Performance 标签分析加载时间

## 🔧 配置说明

### Vite 配置
- **配置文件**：`vite.config.js`
- **开发服务器端口**：5173
- **热更新**：自动启用

### 环境变量
如果需要配置环境变量，可以：
1. 创建 `.env` 文件
2. 添加变量：`VITE_API_BASE_URL=http://localhost:8080`
3. 在代码中使用：`import.meta.env.VITE_API_BASE_URL`

## 📚 相关文档

- [Vite 官方文档](https://vitejs.dev/)
- [React 官方文档](https://react.dev/)
- [Ant Design 官方文档](https://ant.design/)

