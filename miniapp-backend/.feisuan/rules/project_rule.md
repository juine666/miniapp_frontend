
# 开发规范指南

为保证代码质量、可维护性、安全性与可扩展性，请在开发过程中严格遵循以下规范。

## 一、技术栈要求

- **主框架**：Spring Boot 3.5.7  
- **语言版本**：Java 18  
- **构建工具**：Gradle  
- **数据库访问**：MyBatis-Plus  
- **核心依赖**：
  - `spring-boot-starter-web`
  - `spring-boot-starter-security`
  - `spring-boot-starter-validation`
  - `mybatis-plus-boot-starter`
  - `lombok`
  - `springdoc-openapi-starter-webmvc-ui`
  - `jjwt-api/jjwt-impl/jjwt-jackson`
  - `flyway-core`
  - `aliyun-sdk-oss`

## 二、目录结构说明

```
miniapp-backend
├── gradle/
│   └── wrapper/
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/
    │   │       └── stylemirror/
    │   │           └── miniapp_backend/
    │   │               ├── common/         # 公共工具类
    │   │               ├── config/         # 配置类
    │   │               ├── controller/     # 控制器层
    │   │               │   └── admin/      # 管理员相关接口
    │   │               ├── domain/         # 领域模型（实体）
    │   │               ├── repository/     # 数据访问层
    │   │               ├── security/       # 安全认证相关
    │   │               └── service/        # 服务层
    │   └── resources/
    │       ├── db/
    │       │   └── migration/              # Flyway 数据库迁移脚本
    │       ├── static/                     # 静态资源
    │       └── templates/                  # 模板文件
    └── test/
        └── java/
            └── com/
                └── stylemirror/
                    └── miniapp_backend/
```

## 三、分层架构规范

| 层级        | 职责说明                         | 开发约束与注意事项                                               |
|-------------|----------------------------------|----------------------------------------------------------------|
| **Controller** | 处理 HTTP 请求与响应，定义 API 接口 | 不得直接访问数据库，必须通过 Service 层调用                  |
| **Service**    | 实现业务逻辑、事务管理与数据校验   | 必须通过 Repository 层访问数据库；返回 DTO 而非 Entity（除非必要） |
| **Repository** | 数据库访问与持久化操作             | 使用 MyBatis-Plus 进行 CRUD 操作；避免 N+1 查询问题             |
| **Domain**     | 映射数据库表结构                   | 不得直接返回给前端（需转换为 DTO）；包名统一为 `domain`         |

### 接口与实现分离

- 所有接口实现类需放在接口所在包下的 `impl` 子包中。

## 四、安全与性能规范

### 输入校验

- 使用 `@Valid` 与 JSR-303 校验注解（如 `@NotBlank`, `@Size` 等）
  - 注意：Spring Boot 3.x 中校验注解位于 `jakarta.validation.constraints.*`

- 禁止手动拼接 SQL 字符串，防止 SQL 注入攻击。

### 事务管理

- `@Transactional` 注解仅用于 **Service 层**方法。
- 避免在循环中频繁提交事务，影响性能。

## 五、代码风格规范

### 命名规范

| 类型       | 命名方式             | 示例                  |
|------------|----------------------|-----------------------|
| 类名       | UpperCamelCase       | `UserServiceImpl`     |
| 方法/变量  | lowerCamelCase       | `saveUser()`          |
| 常量       | UPPER_SNAKE_CASE     | `MAX_LOGIN_ATTEMPTS`  |

### 注释规范

- 所有类、方法、字段需添加 **Javadoc** 注释。
- 使用中文注释以提升团队协作效率。

### 类型命名规范（阿里巴巴风格）

| 后缀 | 用途说明                     | 示例         |
|------|------------------------------|--------------|
| DTO  | 数据传输对象                 | `UserDTO`    |
| DO   | 数据库实体对象               | `UserDO`     |
| BO   | 业务逻辑封装对象             | `UserBO`     |
| VO   | 视图展示对象                 | `UserVO`     |
| Query| 查询参数封装对象             | `UserQuery`  |

### 实体类简化工具

- 使用 Lombok 注解替代手动编写 getter/setter/构造方法：
  - `@Data`
  - `@NoArgsConstructor`
  - `@AllArgsConstructor`

## 六、扩展性与日志规范

### 接口优先原则

- 所有业务逻辑通过接口定义（如 `UserService`），具体实现放在 `impl` 包中（如 `UserServiceImpl`）。

### 日志记录

- 使用 `@Slf4j` 注解代替 `System.out.println`

## 七、其他通用规则

### 工程环境信息

- **操作系统**：Mac OS X  
- **工作目录**：`/Users/leiyong/Documents/cursor/StyleMirrorAi/miniapp-backend`  
- **作者**：leiyong  

### 构建工具和 SDK 版本

- **SDK 版本**：JDK 18.0.2  
- **构建工具**：Gradle  

### 第三方组件使用

- 使用了如下第三方组件及功能模块：

| 功能模块       | 组件名称                      | 描述                                 |
|----------------|-------------------------------|--------------------------------------|
| Swagger UI     | springdoc-openapi             | 提供 API 文档可视化界面              |
| JWT 认证       | jjwt                          | 实现用户身份验证                     |
| 文件上传       | Aliyun OSS SDK                | 支持阿里云对象存储                   |
| 数据库迁移     | Flyway                        | 自动化执行数据库变更脚本             |

---

以上规范由 leiyong 编写并维护，适用于当前项目的开发流程，请全体成员共同遵守。
