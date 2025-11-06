# JDK 17 安装和配置说明

## 安装 JDK 17

### 方法1：使用 Homebrew（推荐）

```bash
# 安装 JDK 17
brew install --cask temurin@17
```

如果安装需要密码，请在终端中手动运行上述命令。

### 方法2：手动下载安装

1. 访问：https://adoptium.net/temurin/releases/?version=17
2. 下载 macOS 版本的 `.pkg` 安装包
3. 双击安装包进行安装

## 配置环境变量

### 临时设置（当前终端会话）

```bash
# 设置 JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# 验证
java -version
```

### 永久设置（推荐）

编辑你的 shell 配置文件：

**如果使用 zsh（macOS 默认）：**
```bash
vim ~/.zshrc
```

**如果使用 bash：**
```bash
vim ~/.bash_profile
```

添加以下内容：
```bash
# JDK 17 配置
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
```

然后重新加载配置：
```bash
# zsh
source ~/.zshrc

# bash
source ~/.bash_profile
```

### 使用提供的脚本

```bash
cd miniapp-backend
./setup-jdk17.sh
```

## 验证安装

```bash
# 查看所有已安装的 JDK
/usr/libexec/java_home -V

# 查看当前使用的 Java 版本
java -version

# 查看 JAVA_HOME
echo $JAVA_HOME
```

## 切换 JDK 版本

如果需要切换回 JDK 18：
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 18)
```

如果需要切换到 JDK 17：
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

## 项目配置

项目已配置为使用 JDK 17：
- `pom.xml` 中 `java.version` 已设置为 `17`
- Maven 编译时会使用 JDK 17

## 在 IDE 中配置

### IntelliJ IDEA

1. **File** → **Project Structure** → **Project**
2. 设置 **SDK** 为 JDK 17
3. 设置 **Language level** 为 17

### 验证项目编译

```bash
cd miniapp-backend
mvn clean compile -DskipTests
```

如果编译成功，说明 JDK 17 配置正确。

