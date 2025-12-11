# 🧠 AI 开发提示词模板库（Prompt Library）

适用于 ChatGPT / Cursor / Copilot 等智能代码生成与审查场景。

---

## 💻 `/generate-service` —— 业务模块生成

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

---

## 🧩 `/refactor` —— 代码优化与重构

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

---

## 🧪 `/generate-test` —— 单元测试生成

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

---

## 📘 `/api-doc` —— API 文档生成

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

## 📦 代码规范约定（可全局通用）

```yaml
language: Java
rules:
  - 类名：PascalCase（大驼峰命名法）
  - 方法/变量名：camelCase（小驼峰命名法）
  - 常量名：大写 + 下划线分隔
  - 日志统一使用 @Slf4j
  - 控制层仅负责请求分发
  - Service 层只负责业务逻辑
  - Repository 层负责数据库操作
  - 统一返回类 ApiResponse<T>
  - 核心逻辑须有注释，遵循项目代码注释规范
  - 不允许出现 System.out.println
  - 使用 @Transactional 处理事务
  - POJO类属性必须使用包装数据类型（阿里巴巴开发手册强制要求）
  - 构造方法里面禁止加入任何业务逻辑（阿里巴巴开发手册强制要求）
```

---

## 🔧 版本兼容性配置（当前项目实际配置）

### ✅ 当前项目版本组合（稳定配置）

```yaml
framework_versions:
  spring_boot: "3.1.5"           # ✅ 稳定版本，与 MyBatis Plus 兼容
  mybatis_plus: "3.5.7"          # ✅ 稳定版本，功能完整
  maven: "3.8.5"                 # ✅ 需配合 IDEA 2022.1+
  jdk: "17"                      # ✅ 推荐版本
  idea: "2023.3"                # ✅ 最低要求（推荐 2023.3）
```

### 📊 版本兼容性矩阵

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

### 🎯 新项目快速配置模板

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

### 📝 创建新项目检查清单

- [ ] Spring Boot: 3.1.5（推荐）
- [ ] MyBatis Plus: 3.5.7（推荐）
- [ ] JDK: 17
- [ ] IDEA: 2023.3（推荐 2023.3）
- [ ] Maven: 3.8.5（需配合新版本 IDEA）

---

## 🚫 项目禁止事项

1. ❌ **禁止使用 `System.out.println()`**，统一使用日志
2. ❌ **禁止在 Controller 中编写业务逻辑**
3. ❌ **禁止直接使用 `new` 创建 Service 实例**，使用依赖注入
4. ❌ **禁止在循环中进行数据库查询**，使用批量查询
5. ❌ **禁止硬编码配置信息**，使用配置文件或常量类
6. ❌ **禁止忽略异常**，必须处理或向上抛出
7. ❌ **禁止使用魔法数字**，使用常量或枚举
8. ❌ **禁止提交敏感信息**（密码、密钥等）到代码仓库

---

## 📚 参考资源

- [阿里巴巴 Java 开发手册](https://developer.aliyun.com/special/tech-java)
- [MyBatis Plus 官方文档](https://baomidou.com/)
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [项目规则摘要](PROJECT_RULES_SUMMARY.md)

---

## 📘 如何使用

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

**注意**: 本提示词模板库基于当前项目的实际配置和规范制定，所有代码生成和审查都应遵循以上规范。