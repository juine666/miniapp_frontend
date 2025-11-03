# 媒体下载器

一个可以从网页下载所有图片和视频的Flask应用。

## 功能特点

- 📥 从任意网页自动下载所有图片和视频
- 📁 自动按日期时间创建文件夹分类保存
- 🚀 一键下载，无需选择文件类型
- 📊 显示下载进度和文件信息
- 🌐 提供Web界面和API接口

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动

## 使用方法

### Web界面
1. 打开浏览器访问 `http://localhost:5000`
2. 输入要下载的网页URL
3. 点击"自动下载所有媒体文件"

### API接口

#### 下载媒体
```bash
curl -X POST http://localhost:5000/api/download_media \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/page"
  }'
```

#### 查看已下载文件
```bash
curl http://localhost:5000/api/media_list
```

## 文件结构

```
StoreLIve/
├── app.py                 # 主应用文件
├── requirements.txt       # 依赖包列表
├── static/
│   └── index.html        # Web界面
├── audio_cache/          # 音频缓存文件夹
└── downloaded_media/     # 下载的媒体文件
    └── YYYYMMDD_HHMMSS/  # 按时间命名的子文件夹
        ├── image_001.jpg
        ├── image_002.png
        ├── video_001.mp4
        └── ...
```

## 注意事项

- 确保目标网页允许爬取
- 大文件下载可能需要较长时间
- 某些网站可能有反爬虫机制
- 下载的文件会保存在 `downloaded_media` 文件夹中
