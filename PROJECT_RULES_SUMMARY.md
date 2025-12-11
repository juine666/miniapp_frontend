# 项目规则摘要

这份文档总结了当前项目的各项规则和规范，方便你在后续项目中参考使用。

## 技术栈版本

```yaml
framework_versions:
  spring_boot: "3.1.5"      # 稳定版本，与 MyBatis Plus 兼容
  mybatis_plus: "3.5.7"     # 稳定版本，功能完整
  maven: "3.8.5"           # 构建工具版本
  jdk: "17"                 # Java 开发工具包版本
  idea: "2023.3+"           # IntelliJ IDEA 推荐版本
```

## 构建工具规则

### ⚠️ 重要：只使用 Maven，不使用 Gradle

**本项目统一使用 Maven 作为构建工具，禁止使用 Gradle。**

#### ✅ 允许的操作
- 使用 Maven 命令进行构建和运行
- 使用 `pom.xml` 管理依赖
- 使用 `mvn` 命令进行开发、测试、打包

#### ❌ 禁止的操作
- 不要添加 Gradle 相关文件：
  - `build.gradle`
  - `settings.gradle`
  - `gradlew` / `gradlew.bat`
  - `gradle/` 目录
  - `.gradle/` 目录
- 不要使用 Gradle 命令：
  - `./gradlew`
  - `gradle`
  - `gradle bootRun`
- 不要在 IDE 中配置 Gradle 项目

#### 🔧 常用 Maven 命令

```bash
# 清理并编译
mvn clean compile

# 清理并打包
mvn clean package

# 运行应用（跳过测试）
mvn spring-boot:run -DskipTests

# 运行测试
mvn test

# 安装到本地仓库
mvn clean install
```

#### 📝 IDE 配置要求

- **IntelliJ IDEA**：
  - 必须配置为 Maven 项目
  - 不要导入为 Gradle 项目
  - 如果误导入 Gradle，请删除 `.idea/gradle.xml` 并重新导入

## Git 提交规范

### 提交信息格式

提交信息应遵循以下格式：

```
<类型>: <简短描述>

<详细描述>

<改动说明>
- 改动点1
- 改动点2
- 改动点3

<影响范围>
- 影响的模块或功能

<测试说明>
- 如何测试这些改动
```

### 类型说明

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

### Git 配置

- 已配置 SSH 远程仓库：`git@github.com:juine666/miniapp_frontend.git`
- 已创建提交模板文件：`.gitmessage`
- 已配置 Git Hook，提交时会自动在提交信息中添加改动的文件列表

### 常用 Git 命令

```bash
# 添加改动文件
git add .

# 提交（会自动打开编辑器显示模板）
git commit

# 推送代码
git push

# 查看状态
git status

# 查看改动
git diff

# 查看提交历史
git log --oneline
```

## 代码规范

### 依赖管理
- 所有依赖在 `pom.xml` 中管理
- 添加新依赖时，确保版本号明确
- 定期更新依赖版本，保持安全性

### 版本控制
- 不要提交敏感配置文件（application.yml）
- 使用 `.example` 文件作为配置模板
- 确保 `.gitignore` 配置正确

### 编码规范
- Java代码遵循标准命名规范：类名使用大驼峰命名法（UpperCamelCase），方法名和变量名使用小驼峰命名法（lowerCamelCase）
- 常量使用全大写字母加下划线命名（UPPER_SNAKE_CASE）
- 使用Lombok注解简化实体类代码（@Data、@Getter、@Setter等）
- 控制器类使用@RestController注解，服务类使用@Service注解，数据访问类使用@Mapper注解

### 阿里巴巴Java开发手册规范
- 【强制】所有的POJO类属性必须使用包装数据类型
- 【强制】RPC方法的返回值和参数必须使用包装数据类型
- 【强制】所有的局部变量推荐使用基本数据类型
- 【强制】构造方法里面禁止加入任何业务逻辑，如果有初始化逻辑，请放在init方法中
- 【强制】 POJO类必须写toString方法，使用IDE的自动源码生成
- 【推荐】使用4个空格缩进，禁止使用tab字符
- 【推荐】单个方法的总行数不超过80行
- 【推荐】循环体内不要使用"+"拼接字符串，使用StringBuilder
- 【推荐】类内方法定义顺序依次是：公有方法或保护方法 > 私有方法 > getter/setter方法
- 【推荐】接口类中的方法和属性不要加任何修饰符号（public 也不要加），保持代码的简洁性

### 日志规范
- 使用SLF4J日志框架，通过@Slf4j注解简化日志记录
- 日志级别按需使用：ERROR（错误）、WARN（警告）、INFO（信息）、DEBUG（调试）、TRACE（跟踪）
- 生产环境建议使用INFO级别，开发环境可使用DEBUG级别
- 敏感信息（如密码、密钥等）不得记录到日志中
- 异常信息应完整记录堆栈跟踪，便于问题排查

### SQL日志配置
- MyBatis Plus已配置SQL日志输出：`mybatis-plus.configuration.log-impl: org.apache.ibatis.logging.stdout.StdOutImpl`
- 开发环境可在控制台直接查看完整的SQL语句和参数值
- 日志配置文件：`logback-spring.xml`，包含详细的日志格式和级别设置

## 项目结构

项目采用多模块结构：
- `miniapp-backend`: Spring Boot 后端服务
- `miniapp-frontend`: 微信小程序前端
- `admin-frontend`: 管理后台前端
- `StoreLIve`: 其他相关模块

## 环境配置

- JDK 17
- Maven 3.8.5
- MySQL 数据库
- Redis 缓存
- 阿里云 OSS 存储服务

## 前端规范

### 微信小程序前端
- 使用原生微信小程序语法开发
- 页面结构遵循微信小程序标准：WXML、WXSS、JS、JSON
- 网络请求统一使用封装的request工具函数
- 页面路由和导航遵循微信小程序规范

### 管理后台前端
- 使用React框架开发
- 组件化开发模式，提高代码复用性
- 状态管理使用Redux或Context API
- UI组件库可根据项目需求选择（如Ant Design、Element UI等）

### 前端编码规范
- JavaScript代码遵循ES6+标准
- 变量命名采用小驼峰命名法（lowerCamelCase）
- 常量使用全大写字母加下划线命名（UPPER_SNAKE_CASE）
- 组件文件名使用大驼峰命名法（UpperCamelCase）
- CSS类名使用短横线分隔命名法（kebab-case）