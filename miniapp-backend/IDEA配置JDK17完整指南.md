# IntelliJ IDEA 配置 JDK 17 完整指南

## 问题症状

- 错误: 不支持发行版本 18
- Language level is invalid or missing in pom.xml. Current project JDK is 17. Specify language level in miniapp-backend

## 解决步骤

### 1. 确保系统环境已配置 JDK 17

在终端中运行：
```bash
source ~/.zshrc
java -version
# 应该显示 Java 17.0.12
```

### 2. 在 IntelliJ IDEA 中配置项目 JDK

#### 步骤 2.1：打开项目结构设置

- 按 `Cmd + ;` (Mac) 或 `Ctrl + Alt + Shift + S` (Windows/Linux)
- 或 **File** → **Project Structure**

#### 步骤 2.2：设置项目 SDK

1. 在左侧选择 **Project**
2. 在 **SDK** 下拉框中选择 **17**
   - 如果没有，点击下拉框 → **Add SDK** → **Add JDK**
   - 选择路径：`/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`
3. 在 **Language level** 下拉框中选择 **17 - Sealed types, always-strict floating-point semantics**
4. 点击 **Apply**

#### 步骤 2.3：设置模块 Language level

1. 在左侧选择 **Modules**
2. 选择 `miniapp-backend` 模块
3. 在 **Language level** 下拉框中选择 **17**
4. 点击 **Apply** 和 **OK**

### 3. 配置 Maven 使用 JDK 17

#### 步骤 3.1：打开 Maven 设置

- **Preferences** (`Cmd + ,`) → **Build, Execution, Deployment** → **Build Tools** → **Maven**

#### 步骤 3.2：配置 Maven Runner

1. 切换到 **Runner** 标签页
2. 在 **JRE** 下拉框中选择 **17**
   - 如果没有，点击下拉框 → **Add...** → 选择：
     `/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`
3. 勾选 **Use Project Settings**
4. 点击 **Apply** 和 **OK**

#### 步骤 3.3：配置 Maven Home（如果使用本地 Maven）

1. 在 **Maven** 设置页面
2. **Maven home path**: `/Users/leiyong/Documents/tool/apache-maven-3.8.5`
3. 点击 **Apply**

### 4. 重新导入 Maven 项目

1. **清除缓存**（推荐）：
   - **File** → **Invalidate Caches / Restart...**
   - 勾选 **Clear file system cache and Local History**
   - 点击 **Invalidate and Restart**

2. **重新导入项目**：
   - 重启后，右键点击 `pom.xml`
   - 选择 **Maven** → **Reload Project**
   - 或点击右侧 Maven 工具窗口的刷新按钮（🔄）

### 5. 验证配置

#### 在 IDEA 中验证

1. **查看项目结构**：
   - `Cmd + ;` → **Project** → 确认 **SDK** 和 **Language level** 都是 **17**

2. **查看 Maven 配置**：
   - 打开 Maven 工具窗口
   - 查看依赖树是否正常加载

3. **编译项目**：
   - **Build** → **Build Project**
   - 应该不再出现 "不支持发行版本 18" 的错误

#### 在终端中验证

```bash
# 重新加载配置
source ~/.zshrc

# 检查 Java 版本
java -version
# 应该显示: java version "17.0.12"

# 检查 Maven 使用的 Java 版本
mvn -version
# 应该显示: Java version: 17.0.12

# 编译项目
cd miniapp-backend
mvn clean compile
# 应该成功编译
```

## 配置摘要

### 系统环境变量
- **JAVA_HOME**: `/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`
- 配置文件：`~/.zshrc` 和 `~/.bash_profile`

### IDEA 项目配置
- **Project SDK**: 17
- **Project Language level**: 17
- **Module Language level**: 17
- **Maven Runner JRE**: 17

### pom.xml 配置
- `<java.version>17</java.version>`
- `maven-compiler-plugin` 配置：
  - `<source>17</source>`
  - `<target>17</target>`
  - `<release>17</release>`

## 常见问题

### Q: 重新加载配置后还是显示 JDK 18

A: 
1. 完全关闭并重新打开终端
2. 在 IDEA 中：**File** → **Invalidate Caches / Restart...** → **Invalidate and Restart**
3. 检查 IDEA 的 **Project Structure** → **Project** → **SDK** 是否为 17

### Q: Maven 编译时还是使用 JDK 18

A: 
1. 检查 **Maven** → **Runner** → **JRE** 是否为 17
2. 在终端中运行 `mvn -version` 确认 Maven 使用的 Java 版本
3. 如果还是 18，运行 `source ~/.zshrc` 重新加载配置

### Q: IDEA 提示 "Language level is invalid"

A: 
1. 确保 **Project Structure** → **Modules** → `miniapp-backend` → **Language level** 设置为 **17**
2. 重新导入 Maven 项目
3. 清除缓存并重启 IDEA

### Q: 找不到 JDK 17

A: 
1. 确认 JDK 17 已安装：`/usr/libexec/java_home -V`
2. 在 **Project Structure** → **Project** → **SDK** → **Add SDK** → **Add JDK**
3. 手动选择路径：`/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`

## 快速检查清单

- [ ] 系统 `java -version` 显示 17
- [ ] 系统 `mvn -version` 显示 Java 17
- [ ] IDEA Project SDK 设置为 17
- [ ] IDEA Project Language level 设置为 17
- [ ] IDEA Module Language level 设置为 17
- [ ] IDEA Maven Runner JRE 设置为 17
- [ ] pom.xml 中 `java.version` 为 17
- [ ] pom.xml 中 `maven-compiler-plugin` 配置为 17
- [ ] 项目可以成功编译

