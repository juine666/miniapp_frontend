# IDEA 中项目不显示 src 目录的修复方法

## 问题症状

在 IntelliJ IDEA 的 Project 窗口中，`src` 目录不显示，但文件系统中 `src` 目录确实存在。

## 解决方法

### 方法 1：重新导入 Maven 项目（推荐）

1. **右键点击 `pom.xml`**
2. 选择 **Maven** → **Reload Project**
3. 等待 Maven 重新导入完成

### 方法 2：重新配置模块

1. **打开项目结构**：
   - 按 `Cmd + ;` 或 **File** → **Project Structure**

2. **检查模块配置**：
   - 在左侧选择 **Modules**
   - 选择 `miniapp-backend` 模块
   - 查看 **Sources** 标签页
   - 确认 `src/main/java` 标记为 **Sources**（蓝色文件夹图标）
   - 确认 `src/main/resources` 标记为 **Resources**（在 Sources 标签页中显示，类型为 `java-resource`）
   - 确认 `src/test/java` 标记为 **Test Sources**（绿色文件夹图标）

3. **如果目录未标记，手动添加**：
   - 点击 **Sources** 标签页
   - 点击 **+** 按钮
   - 选择 `src/main/java` → 标记为 **Sources**（蓝色）
   - 选择 `src/main/resources` → 标记为 **Resources**（在 Sources 标签页中，类型选择 `java-resource`）
   - 选择 `src/test/java` → 标记为 **Test Sources**（绿色）

4. 点击 **Apply** 和 **OK**

### 方法 3：检查目录是否被排除

1. **打开项目结构**：
   - 按 `Cmd + ;` 或 **File** → **Project Structure**

2. **检查排除的目录**：
   - 在左侧选择 **Modules**
   - 选择 `miniapp-backend` 模块
   - 查看 **Sources** 标签页
   - 检查是否有目录被标记为 **Excluded**（红色）
   - 如果有，选中后点击 **-** 按钮移除排除标记

3. 点击 **Apply** 和 **OK**

### 方法 4：检查项目视图设置

1. **在 Project 窗口中**：
   - 点击右上角的设置图标（齿轮图标）
   - 取消勾选 **Hide Empty Middle Packages**
   - 取消勾选 **Flatten Packages**（如果已勾选）

2. **切换视图**：
   - 在 Project 窗口顶部，点击 **Packages** 或 **Project** 视图切换
   - 尝试不同的视图模式

### 方法 5：清除缓存并重新导入

1. **清除缓存**：
   - **File** → **Invalidate Caches / Restart...**
   - 勾选 **Clear file system cache and Local History**
   - 点击 **Invalidate and Restart**

2. **重新导入项目**：
   - 重启后，右键点击 `pom.xml`
   - 选择 **Maven** → **Reload Project**

### 方法 6：手动删除 .iml 文件并重新导入

⚠️ **注意**：此方法会删除 IDEA 的模块配置文件，需要重新导入。

1. **关闭 IDEA**

2. **删除 .iml 文件**：
   ```bash
   rm miniapp-backend/miniapp-backend.iml
   ```

3. **重新打开 IDEA**

4. **导入项目**：
   - IDEA 会提示检测到 Maven 项目
   - 选择 **Import Maven Project**
   - 等待导入完成

## 快速检查清单

- [ ] `src` 目录在文件系统中存在
- [ ] `pom.xml` 文件存在且格式正确
- [ ] Maven 项目已正确导入
- [ ] 模块的 Sources 目录已正确标记
- [ ] 没有目录被标记为 Excluded
- [ ] Project 视图设置正确

## 验证

配置完成后，在 Project 窗口中应该能看到：
```
miniapp-backend
  └── src
      ├── main
      │   ├── java
      │   └── resources
      └── test
          └── java
```

## 常见原因

1. **Maven 项目未正确导入**：最常见的原因
2. **模块配置丢失**：`.iml` 文件配置错误
3. **目录被排除**：`src` 目录被标记为 Excluded
4. **视图设置问题**：Project 视图设置导致目录隐藏
5. **缓存问题**：IDEA 缓存损坏

## 推荐操作顺序

1. 先尝试 **方法 1**（重新导入 Maven 项目）
2. 如果不行，尝试 **方法 2**（重新配置模块）
3. 如果还不行，尝试 **方法 5**（清除缓存）
4. 最后尝试 **方法 6**（删除 .iml 文件）

