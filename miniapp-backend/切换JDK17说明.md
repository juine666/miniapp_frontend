# 切换 JDK 17 说明

## 已完成的配置

✅ 已更新 `~/.zshrc` 和 `~/.bash_profile`，将 Java 版本设置为 17

## 如何使配置生效

### 方法 1：重新加载配置（推荐）

在当前终端中运行：
```bash
source ~/.zshrc
```

或者：
```bash
source ~/.bash_profile
```

然后验证：
```bash
java -version
```

应该显示：
```
java version "17.0.12" 2024-07-16 LTS
```

### 方法 2：重新打开终端

关闭当前终端窗口，重新打开一个新的终端窗口，然后运行：
```bash
java -version
```

### 方法 3：完全重启终端应用

如果上述方法都不行，完全退出终端应用（如 iTerm2、Terminal.app），然后重新打开。

## 验证配置

运行以下命令验证：

```bash
# 检查 Java 版本
java -version

# 检查 JAVA_HOME
echo $JAVA_HOME
# 应该显示：/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home

# 检查使用的 Java 路径
which java
# 应该显示：/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home/bin/java

# 检查 Maven 使用的 Java 版本
mvn -version
# 应该显示：Java version: 17.0.12
```

## 如果还是显示 JDK 18

如果重新加载配置后还是显示 JDK 18，请检查：

1. **是否有其他配置文件**：
   ```bash
   cat ~/.profile 2>/dev/null | grep -i java
   cat ~/.bashrc 2>/dev/null | grep -i java
   ```

2. **检查当前 PATH**：
   ```bash
   echo $PATH | tr ':' '\n' | grep -i java
   ```
   确保 JDK 17 的路径在 JDK 18 之前。

3. **手动设置（临时测试）**：
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   export PATH="$JAVA_HOME/bin:$PATH"
   java -version
   ```

## 配置说明

- **JAVA_HOME**: 使用 `/usr/libexec/java_home -v 17` 自动选择 JDK 17
- **PATH**: 确保 `$JAVA_HOME/bin` 在 PATH 的最前面，优先使用 JDK 17

