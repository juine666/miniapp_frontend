# Git 提交指南

## 已配置的功能

### 1. SSH 远程仓库
- 远程仓库已配置为 SSH 方式：`git@github.com:juine666/miniapp_frontend.git`
- 推送时无需输入密码（需要 SSH 密钥已添加到 GitHub）

### 2. 提交模板
- 已创建提交模板文件：`.gitmessage`
- 每次执行 `git commit` 时会自动加载模板
- 模板包含类型、描述、改动说明等字段

### 3. 自动添加改动文件
- 已配置 Git Hook：`.git/hooks/prepare-commit-msg`
- 提交时会自动在提交信息中添加改动的文件列表

## 使用方法

### 方式1：使用 Git 提交（推荐）
```bash
# 1. 添加改动文件
git add .

# 2. 提交（会自动打开编辑器显示模板）
git commit

# 3. 填写提交信息后保存退出
# 编辑器会显示模板，填写：
# - 类型和简短描述（第一行）
# - 详细描述
# - 改动说明
# - 影响范围
# - 测试说明

# 4. 推送代码
git push
```

### 方式2：使用 -m 参数（快速提交）
```bash
git commit -m "feat: 添加新功能"
# 注意：这种方式不会使用模板，建议用于小的改动
```

### 方式3：使用 VS Code 或其他编辑器
如果你使用 VS Code：
1. 在 VS Code 中打开终端
2. 执行 `git commit`
3. 会自动在 VS Code 中打开提交模板
4. 填写后保存即可

## 提交信息格式

### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 示例
```
feat: 添加商品位置选择功能

详细描述: 在发布商品页面添加位置选择功能，支持使用当前位置或地图选择

改动说明:
- 添加位置选择UI组件
- 集成微信地图API
- 保存位置信息到商品数据

影响范围:
- pages/publish/publish.js
- pages/publish/publish.wxml

测试说明:
- 测试使用当前位置功能
- 测试地图选择位置功能
```

## 推送代码

### 首次推送
```bash
git push -u origin main
```

### 后续推送
```bash
git push
```

## 查看提交历史
```bash
git log --oneline
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
```

## 常用命令

```bash
# 查看状态
git status

# 查看改动
git diff

# 查看已暂存的改动
git diff --cached

# 撤销工作区的改动
git checkout -- <file>

# 撤销暂存区的改动
git reset HEAD <file>

# 查看提交历史
git log

# 创建新分支
git checkout -b feature/新功能名称

# 切换分支
git checkout main

# 合并分支
git merge feature/新功能名称
```

