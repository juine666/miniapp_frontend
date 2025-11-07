# IDEA 中资源目录的正确配置

## 目录标记说明

在 IntelliJ IDEA 的 Maven 项目中，目录应该按以下方式标记：

### 标准 Maven 目录结构

1. **`src/main/java`**
   - 标记类型：**Sources**
   - 显示颜色：蓝色文件夹图标
   - 用途：Java 源代码文件

2. **`src/main/resources`**
   - 标记类型：**Resources**（类型为 `java-resource`）
   - 显示位置：在 **Sources** 标签页中
   - 用途：资源文件（如 `application.yml`、`application.properties` 等）
   - **注意**：这不是绿色的 Test Sources，而是在 Sources 标签页中的 Resources 类型

3. **`src/test/java`**
   - 标记类型：**Test Sources**
   - 显示颜色：绿色文件夹图标
   - 用途：测试源代码文件

4. **`src/test/resources`**（如果存在）
   - 标记类型：**Test Resources**（类型为 `test-resource`）
   - 显示位置：在 **Sources** 标签页中
   - 用途：测试资源文件

## 在 IDEA 中检查配置

### 步骤 1：打开模块配置

1. 按 `Cmd + ;` 或 **File** → **Project Structure**
2. 在左侧选择 **Modules**
3. 选择 `miniapp-backend` 模块
4. 点击 **Sources** 标签页

### 步骤 2：检查目录标记

在 **Sources** 标签页中，你应该看到：

- **`src/main/java`** - 显示为蓝色，标记为 **Sources**
- **`src/main/resources`** - 在列表中显示，类型为 **Resources**（不是绿色的 Test Sources）
- **`src/test/java`** - 显示为绿色，标记为 **Test Sources**

### 步骤 3：如果配置不正确

1. **选中目录**，点击上方的标记按钮：
   - `src/main/java` → 点击 **Sources** 按钮（蓝色）
   - `src/main/resources` → 点击 **Resources** 按钮（在 Sources 标签页中）
   - `src/test/java` → 点击 **Test Sources** 按钮（绿色）

2. 或者**右键点击目录** → **Mark Directory as** → 选择正确的类型

## 在 .iml 文件中的配置

正确的 `.iml` 文件配置应该是：

```xml
<sourceFolder url="file://$MODULE_DIR$/src/main/java" isTestSource="false" />
<sourceFolder url="file://$MODULE_DIR$/src/main/resources" type="java-resource" />
<sourceFolder url="file://$MODULE_DIR$/src/test/java" isTestSource="true" />
```

## 常见误解

❌ **错误理解**：`src/main/resources` 应该显示为绿色的 Test Sources

✅ **正确理解**：`src/main/resources` 是 Resources 类型，在 Sources 标签页中显示，但不是绿色的 Test Sources。绿色的 Test Sources 是 `src/test/java`。

## 验证配置

配置正确后，在 Project 窗口中应该能看到：

```
miniapp-backend
  └── src
      ├── main
      │   ├── java          (蓝色 - Sources)
      │   └── resources     (Resources，在 Sources 标签页中)
      └── test
          └── java          (绿色 - Test Sources)
```

## 如果还是看不到 src 目录

1. **重新导入 Maven 项目**：
   - 右键 `pom.xml` → **Maven** → **Reload Project**

2. **清除缓存**：
   - **File** → **Invalidate Caches / Restart...** → **Invalidate and Restart**

3. **检查 Project 视图设置**：
   - 在 Project 窗口右上角，确保没有勾选隐藏空包的选项

