# IntelliJ IDEA 配置本地 Maven 和 JDK 17

## 配置步骤

### 1. 配置本地 Maven

1. **打开设置**：
   - 按 `Cmd + ,` 或 **IntelliJ IDEA** → **Preferences**

2. **进入 Maven 设置**：
   - **Build, Execution, Deployment** → **Build Tools** → **Maven**

3. **配置 Maven 路径**：
   - **Maven home path**: 
     ```
     /Users/leiyong/Documents/tool/apache-maven-3.8.5
     ```
   - 点击文件夹图标浏览选择，或直接粘贴路径

4. **配置用户设置**：
   - **User settings file**: 
     ```
     /Users/leiyong/Documents/tool/apache-maven-3.8.5/conf/settings.xml
     ```
     或使用默认：`~/.m2/settings.xml`

5. **配置本地仓库**：
   - **Local repository**: 
     ```
     /Users/leiyong/Documents/tool/repository
     ```
     或使用默认：`~/.m2/repository`

6. 点击 **Apply**

### 2. 配置 Maven Runner（使用 JDK 17）

1. 在 **Maven** 设置页面，切换到 **Runner** 标签页

2. **配置 JRE**：
   - **JRE**: 选择 **17** 
   - 如果没有，点击下拉框 → **Add...** → 选择：
     ```
     /Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
     ```

3. **其他选项**：
   - ✅ 勾选 **Use Project Settings**
   - ✅ 勾选 **Delegate IDE build/run actions to Maven**（可选）

4. 点击 **Apply** 和 **OK**

### 3. 配置项目 JDK 17

1. **打开项目结构**：
   - 按 `Cmd + ;` 或 **File** → **Project Structure**

2. **设置项目 SDK**：
   - 在 **Project** 标签页：
     - **SDK**: 选择 **17**
     - 如果没有，点击 **Add SDK** → **Add JDK** → 选择：
       ```
       /Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
       ```
     - **Language level**: 选择 **17 - Sealed types, always-strict floating-point semantics**

3. **设置模块 Language level**：
   - 切换到 **Modules** 标签页
   - 选择 `miniapp-backend` 模块
   - **Language level**: 选择 **17**

4. 点击 **Apply** 和 **OK**

### 4. 重新导入 Maven 项目

1. **清除缓存**（可选但推荐）：
   - **File** → **Invalidate Caches / Restart...**
   - 勾选 **Clear file system cache and Local History**
   - 点击 **Invalidate and Restart**

2. **重新导入项目**：
   - 重启后，右键点击 `pom.xml`
   - 选择 **Maven** → **Reload Project**
   - 或点击右侧 Maven 工具窗口的刷新按钮（🔄）

### 5. 验证配置

1. **检查 Maven 版本**：
   - 打开 Maven 工具窗口
   - 查看是否正常显示依赖树

2. **检查 Java 版本**：
   - 在终端运行：
     ```bash
     cd miniapp-backend
     mvn -version
     ```
   - 应该显示 Java 17

3. **编译项目**：
   - 在 IDEA 中：**Build** → **Build Project**
   - 或命令行：`mvn clean compile`

## 配置摘要

### Maven 配置
- **Maven home**: `/Users/leiyong/Documents/tool/apache-maven-3.8.5`
- **User settings**: `/Users/leiyong/Documents/tool/apache-maven-3.8.5/conf/settings.xml` 或 `~/.m2/settings.xml`
- **Local repository**: `/Users/leiyong/Documents/tool/repository` 或 `~/.m2/repository`

### JDK 配置
- **Project SDK**: 17
- **Language level**: 17
- **Maven Runner JRE**: 17
- **JDK 路径**: `/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`

## 常见问题

### Q: Maven 工具窗口显示错误

A: 
1. 检查 Maven home path 是否正确
2. 检查 Maven Runner 的 JRE 是否设置为 17
3. 重新导入项目

### Q: 编译时仍使用 JDK 18

A: 
1. 检查 Project SDK 是否为 17
2. 检查 Maven Runner JRE 是否为 17
3. 清除缓存并重启 IDEA

### Q: 找不到 JDK 17

A: 
1. 确认 JDK 17 已安装：`/usr/libexec/java_home -V`
2. 在 Project Structure 中手动添加 JDK 17 路径

