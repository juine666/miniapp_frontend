# 如何将前后端分开到不同仓库

## 方案1：创建独立仓库（推荐）

### 步骤1：创建新仓库
在GitHub创建两个新仓库：
- `miniapp-backend` - 存放后端代码
- `miniapp-frontend` - 存放前端代码

### 步骤2：分离后端代码

```bash
# 1. 克隆当前仓库（作为备份）
cd /path/to/backup
git clone git@github.com:juine666/miniapp_frontend.git backup

# 2. 创建后端新仓库
cd /path/to/new-location
mkdir miniapp-backend
cd miniapp-backend
git init
git remote add origin git@github.com:juine666/miniapp-backend.git

# 3. 从原仓库提取后端代码
git subtree push --prefix=miniapp-backend origin main
# 或者手动复制文件后提交
```

### 步骤3：分离前端代码

```bash
# 创建前端新仓库
cd /path/to/new-location
mkdir miniapp-frontend
cd miniapp-frontend
git init
git remote add origin git@github.com:juine666/miniapp-frontend.git

# 从原仓库提取前端代码
git subtree push --prefix=miniapp-frontend origin main
```

## 方案2：使用 git subtree（保持关联）

适合需要保持代码关联的场景：

```bash
# 在父仓库中添加子仓库作为subtree
git subtree add --prefix=miniapp-backend \
  git@github.com:juine666/miniapp-backend.git main --squash

# 推送更改到子仓库
git subtree push --prefix=miniapp-backend \
  git@github.com:juine666/miniapp-backend.git main
```

## 方案3：完全分离（手动迁移）

### 后端仓库

```bash
# 1. 创建新仓库目录
mkdir ~/projects/miniapp-backend
cd ~/projects/miniapp-backend
git init

# 2. 复制后端代码
cp -r /path/to/StyleMirrorAi/miniapp-backend/* .

# 3. 创建.gitignore（后端专用）
cat > .gitignore << EOF
# Build outputs
bin/
build/
gradle/
.gradle/
*.class

# Logs
*.log
logs/

# Configuration
application.yml
application.properties
!application.yml.example
EOF

# 4. 提交并推送
git add .
git commit -m "feat: 初始化后端项目"
git remote add origin git@github.com:juine666/miniapp-backend.git
git push -u origin main
```

### 前端仓库

```bash
# 1. 创建新仓库目录
mkdir ~/projects/miniapp-frontend
cd ~/projects/miniapp-frontend
git init

# 2. 复制前端代码
cp -r /path/to/StyleMirrorAi/miniapp-frontend/* .

# 3. 创建.gitignore（前端专用）
cat > .gitignore << EOF
# WeChat Mini Program
project.private.config.json
unpackage/
node_modules/
EOF

# 4. 提交并推送
git add .
git commit -m "feat: 初始化前端项目"
git remote add origin git@github.com:juine666/miniapp-frontend.git
git push -u origin main
```

## 分开后的优势

1. **独立部署**：前后端可以独立部署和版本管理
2. **权限控制**：可以为不同团队设置不同的仓库权限
3. **CI/CD**：可以分别为前后端配置独立的CI/CD流程
4. **仓库体积**：每个仓库更小，克隆更快

## 注意事项

1. **版本同步**：需要手动保持API接口版本一致
2. **文档管理**：建议创建独立的README说明前后端关系
3. **依赖关系**：前端依赖后端API，需要明确API版本要求

## 推荐结构

```
# 主仓库（可以保留用于文档和整体说明）
miniapp_frontend/
├── README.md (说明整体架构)
├── docs/ (文档)
└── .github/ (统一的CI/CD配置)

# 后端仓库
miniapp-backend/
├── src/
├── pom.xml / build.gradle
└── README.md

# 前端仓库  
miniapp-frontend/
├── pages/
├── app.js
└── README.md
```

