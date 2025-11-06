# IDE 配置 JDK 17 说明

## IntelliJ IDEA 配置

### 1. 设置项目 JDK

1. **File** → **Project Structure** (或按 `Cmd + ;`)
2. 在 **Project** 标签页：
   - **SDK**: 选择 **17** (如果没有，点击 **Add SDK** → **Download JDK** → 选择 **17**)
   - **Language level**: 选择 **17 - Sealed types, always-strict floating-point semantics**
3. 点击 **Apply** 和 **OK**

### 2. 设置模块 JDK

1. 在 **Project Structure** 中，切换到 **Modules**
2. 选择 `miniapp-backend` 模块
3. 在 **Language level** 中选择 **17**
4. 点击 **Apply** 和 **OK**

### 3. 设置 Maven Runner JDK

1. **Preferences** (或 `Cmd + ,`) → **Build, Execution, Deployment** → **Build Tools** → **Maven** → **Runner**
2. 在 **JRE** 中选择 **17** (或使用项目 JDK)
3. 点击 **Apply** 和 **OK**

### 4. 重新导入 Maven 项目

1. 右键点击 `pom.xml`
2. 选择 **Maven** → **Reload Project**
3. 或者点击右侧 Maven 工具窗口的刷新按钮

### 5. 验证配置

1. 查看项目结构：**File** → **Project Structure** → **Project**
2. 确认 **SDK** 显示为 **17**
3. 确认 **Language level** 显示为 **17**

## 如果 IDE 中找不到 JDK 17

### 方法1：让 IDE 自动检测

1. **File** → **Project Structure** → **SDKs**
2. 点击 **+** → **Add JDK**
3. 浏览到：`/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`
4. 点击 **OK**

### 方法2：使用 IDE 下载

1. **File** → **Project Structure** → **SDKs**
2. 点击 **+** → **Download JDK**
3. 选择 **Version**: 17
4. 选择 **Vendor**: Eclipse Temurin (推荐) 或 Oracle OpenJDK
5. 点击 **Download**

## 验证配置是否生效

在 IDE 中：
1. 打开任意 Java 文件
2. 查看文件右上角，应该显示 **JDK 17**
3. 编译项目，不应该再有 "不支持发行版本 18" 的错误

## 环境变量设置（可选，但推荐）

为了确保系统默认使用 JDK 17，设置环境变量：

```bash
# 编辑 ~/.zshrc
vim ~/.zshrc

# 添加以下内容
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# 重新加载
source ~/.zshrc

# 验证
java -version
echo $JAVA_HOME
```

## 常见问题

### Q: 仍然显示 "不支持发行版本 18"

A: 
1. 检查 **File** → **Project Structure** → **Project** 中的 SDK 是否为 17
2. 检查 **File** → **Project Structure** → **Modules** 中的 Language level 是否为 17
3. 重新导入 Maven 项目
4. 清除 IDE 缓存：**File** → **Invalidate Caches / Restart...**

### Q: Maven 编译成功但 IDE 报错

A: 
1. 检查 Maven Runner 的 JRE 设置
2. 确保 IDE 的 Project SDK 设置为 17
3. 重新同步项目

### Q: 如何切换回 JDK 18？

A: 在 **Project Structure** → **Project** → **SDK** 中选择 18 即可

