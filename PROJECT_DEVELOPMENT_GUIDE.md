# 📘 项目开发规范与AI辅助指南

这份文档总结了当前项目的各项规则和规范，并提供了AI辅助开发的指导，方便你在后续项目中参考使用。

---

## 🧠 AI 开发提示词模板

适用于 ChatGPT / Cursor / Copilot 等智能代码生成与审查场景。

### 💻 `/generate-service` —— 业务模块生成

```yaml
command: /generate-service
role: "你是一名资深后端开发工程师"
context:
  framework: "Spring Boot 3.1.5 + MyBatis Plus 3.5.7 + Redis"
  database: "MySQL"
  code_style: "阿里巴巴 Java 开发手册规范 + 项目自定义规范"
task: |
  根据以下业务需求生成完整的模块代码（Controller + Service + Mapper + Entity）：

  【业务描述】
  {在这里填写你的业务，比如：实现一个订单支付超时自动取消功能}

要求：
1. 输出目录结构示例；
2. 所有类带完整注释，遵循项目代码注释规范；
3. 命名语义清晰（符合 Java 命名规范和阿里巴巴开发手册）；
4. 提供示例 SQL 或表结构；
5. 所有返回值使用统一封装类 ApiResponse<T>；
6. 日志使用 @Slf4j，不使用 System.out；
7. 遵循分层架构：Controller -> Service -> Repository；
8. 使用 Lombok 注解简化代码；
9. 实体类属性使用包装数据类型（阿里巴巴开发手册强制要求）；
10. 遵循项目中已有的代码风格和最佳实践。
```

### 🧩 `/refactor` —— 代码优化与重构

```yaml
command: /refactor
role: "你是一名高级代码审查专家"
context:
  language: "Java"
  style: "遵守阿里巴巴开发手册和项目自定义规范"
task: |
  请优化以下代码：
  {粘贴你的原始代码}

要求：
1. 修复潜在的命名、空指针、事务、日志问题；
2. 优化方法拆分与职责划分；
3. 增加必要注释，遵循项目代码注释规范；
4. 保持原始逻辑功能不变；
5. 输出优化后的完整代码；
6. 列出主要优化点说明；
7. 遵循阿里巴巴开发手册规范：
   - POJO类属性必须使用包装数据类型
   - 构造方法里面禁止加入任何业务逻辑
   - 类内方法定义顺序：公有方法或保护方法 > 私有方法 > getter/setter方法
8. 遵循项目禁止事项：
   - 禁止使用 System.out.println()，统一使用日志
   - 禁止在 Controller 中编写业务逻辑
   - 禁止直接使用 new 创建 Service 实例，使用依赖注入
```

### 🧪 `/generate-test` —— 单元测试生成

```yaml
command: /generate-test
role: "你是一名资深测试开发工程师"
context:
  framework: "Spring Boot + JUnit5 + Mockito"
task: |
  请为以下 Service 类生成单元测试：
  {粘贴目标 Service 代码}

要求：
1. 使用 JUnit5；
2. 模拟 Repository 层；
3. 覆盖正常、异常、边界三类用例；
4. 每个测试方法添加注释说明；
5. 输出完整的测试类代码；
6. 推荐断言写法；
7. 覆盖率目标 ≥80%；
8. 遵循项目日志规范，使用 SLF4J 日志框架。
```

### 📘 `/api-doc` —— API 文档生成

```yaml
command: /api-doc
role: "你是一名 API 架构设计专家"
context:
  standard: "RESTful + OpenAPI3"
task: |
  根据以下业务描述，生成详细的接口文档：
  {填写业务，如 用户下单、取消订单、查询订单}

要求：
1. 输出接口路径、方法、参数说明、返回结构；
2. 状态码及错误示例；
3. 示例 JSON；
4. 可选：生成 Swagger/OpenAPI 格式；
5. 遵循 REST 命名规范（动词在资源后，如 /orders/{id}/cancel）；
6. 遵循项目中已有的 API 设计风格。
```

---

## 🛠️ 技术栈版本

```yaml
framework_versions:
  spring_boot: "3.1.5"      # 稳定版本，与 MyBatis Plus 兼容
  mybatis_plus: "3.5.7"     # 稳定版本，功能完整
  maven: "3.8.5"           # 构建工具版本
  jdk: "17"                 # Java 开发工具包版本
  idea: "2023.3+"           # IntelliJ IDEA 推荐版本
```

---

## 🔧 构建工具规则

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

---

## 📚 Git 提交规范

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

---

## 💻 代码规范

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

### 代码注释规范
- 【强制】所有公共方法必须编写javadoc注释，包括方法说明、参数说明、返回值说明和异常说明
- 【强制】所有类必须编写javadoc注释，说明类的作用和使用场景
- 【强制】所有非显而易见的业务逻辑必须添加注释说明
- 【强制】所有复杂的算法实现必须添加注释说明
- 【推荐】注释应使用中文，便于团队成员理解和维护
- 【推荐】注释应简洁明了，避免冗余和无意义的注释
- 【推荐】及时更新注释，确保注释与代码保持一致
- 【推荐】使用TODO注释标记待完成的功能，使用FIXME注释标记需要修复的问题

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

---

## 📁 项目结构

项目采用多模块结构：
- `miniapp-backend`: Spring Boot 后端服务
- `miniapp-frontend`: 微信小程序前端
- `admin-frontend`: 管理后台前端
- `StoreLIve`: 其他相关模块

---

## 🌐 环境配置

- JDK 17
- Maven 3.8.5
- MySQL 数据库
- Redis 缓存
- 阿里云 OSS 存储服务

---

## 🖥️ 前端规范

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

---

## 🚫 禁止事项

1. ❌ **禁止使用 `System.out.println()`**，统一使用日志
2. ❌ **禁止在 Controller 中编写业务逻辑**
3. ❌ **禁止直接使用 `new` 创建 Service 实例**，使用依赖注入
4. ❌ **禁止在循环中进行数据库查询**，使用批量查询
5. ❌ **禁止硬编码配置信息**，使用配置文件或常量类
6. ❌ **禁止忽略异常**，必须处理或向上抛出
7. ❌ **禁止使用魔法数字**，使用常量或枚举
8. ❌ **禁止提交敏感信息**（密码、密钥等）到代码仓库

---

## 📊 版本兼容性矩阵

| Spring Boot | MyBatis Plus | 兼容性 | 备注 |
|------------|--------------|--------|------|
| 3.2.0 | 3.5.7 | ❌ | 有 factoryBeanObjectType 错误 |
| **3.1.5** | **3.5.7** | ✅ | **推荐组合** |
| 3.1.x | 3.5.7 | ✅ | 稳定 |

| IDEA 版本 | Maven 版本 | 兼容性 | 备注 |
|-----------|-----------|--------|------|
| 2021.2.3 | 3.8.5 | ❌ | 有 NoSuchMethodError |
| **2022.1+** | **3.8.5** | ✅ | **推荐** |
| 2023.3 | 3.8.5 | ✅ | 最新推荐 |

---

## 🎯 新项目快速配置模板

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.1.5</version>  <!-- ✅ 稳定版本 -->
</parent>

<properties>
    <java.version>17</java.version>
    <mybatis-plus.version>3.5.7</mybatis-plus.version>  <!-- ✅ 稳定版本 -->
</properties>
```

---

## 📝 创建新项目检查清单

- [ ] Spring Boot: 3.1.5（推荐）
- [ ] MyBatis Plus: 3.5.7（推荐）
- [ ] JDK: 17
- [ ] IDEA: 2023.3（推荐 2023.3）
- [ ] Maven: 3.8.5（需配合新版本 IDEA）

---

## 📚 参考资源

- [阿里巴巴 Java 开发手册](https://developer.aliyun.com/special/tech-java)
- [MyBatis Plus 官方文档](https://baomidou.com/)
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [RuoYi 官方文档](https://doc.ruoyi.vip/)

---

## 📘 如何使用AI提示词

### 在 Cursor 中：

1. 打开 "Prompts" → "Custom Commands"；
2. 点击 "Create Command"；
3. 将上方模板复制进去；
4. 命名为 `/generate-service` 等；
5. 下次直接输入命令即可。

### 在 ChatGPT/Copilot 中：

1. 直接复制对应的 prompt 模板；
2. 替换 `{在这里填写你的业务}` 或 `{粘贴你的原始代码}` 部分；
3. 发送给 AI 助手获取帮助。

---

**注意**: 本文档结合了项目规则和AI辅助开发指南，所有代码编写和AI辅助都应遵循以上规范。