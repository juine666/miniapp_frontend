# 添加 SSH 公钥到 GitHub - 快速指南

## ✅ SSH 公钥已复制到剪贴板！

## 添加步骤：

### 1. 打开 GitHub SSH 设置页面
访问：https://github.com/settings/keys

或者：
- 点击右上角头像 → Settings
- 左侧菜单选择 "SSH and GPG keys"
- 点击 "New SSH key" 按钮

### 2. 填写信息
- **Title**: `Mac - StyleMirror` (或任何你喜欢的名称)
- **Key**: 直接粘贴（已经在剪贴板中，按 Cmd+V）
- **Key type**: 选择 "Authentication Key"

### 3. 点击 "Add SSH key"

### 4. 验证连接
添加完成后，在终端运行：
```bash
ssh -T git@github.com
```

如果看到类似 "Hi juine666! You've successfully authenticated..." 的提示，说明添加成功！

### 5. 推送代码
```bash
git push -u origin main
```

## 你的 SSH 公钥（备用）
如果剪贴板中的内容丢失，可以使用：
```bash
cat ~/.ssh/id_rsa.pub
```

