from flask import Flask, request, jsonify, send_file
import os
import requests
import uuid
import re
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from datetime import datetime

app = Flask(__name__)

ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
DEESEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
ELEVEN_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
print("----"+DEESEEK_API_KEY)
AUDIO_FOLDER = "audio_cache"
MEDIA_FOLDER = "downloaded_media"
if not os.path.exists(AUDIO_FOLDER):
    os.makedirs(AUDIO_FOLDER)
if not os.path.exists(MEDIA_FOLDER):
    os.makedirs(MEDIA_FOLDER)

def deepseek_generate(prompt, max_chars=500):
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEESEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一位专业的儿童故事作家。"},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_chars * 2,
        "temperature": 0.7
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"].strip()
    else:
        raise Exception(f"DeepSeek生成失败: {response.status_code} {response.text}")

def tts_eleven(text, voice_id=ELEVEN_VOICE_ID):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": text,
        "voice_settings": {"stability": 0.7, "similarity_boost": 0.75}
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        filename = f"{AUDIO_FOLDER}/{uuid.uuid4()}.mp3"
        with open(filename, "wb") as f:
            f.write(response.content)
        return filename
    else:
        raise Exception(f"TTS 合成失败: {response.status_code} {response.text}")

def download_media_from_page(page_url, css_selector=None):
    """从指定页面下载所有视频和图片到本地文件夹，支持CSS选择器定位"""
    try:
        # 发送请求获取页面内容
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(page_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        downloaded_files = []
        
        # 如果指定了CSS选择器，只在该区域内查找媒体文件
        if css_selector:
            # 尝试多个可能的选择器
            fallback_selectors = [
                css_selector,  # 用户指定的选择器
                'div.post-content .dplayer video',
                'div.post-content video',
                '.dplayer video',
                'video'
            ]
            
            target_element = None
            used_selector = None
            
            for selector in fallback_selectors:
                target_element = soup.select_one(selector)
                if target_element:
                    used_selector = selector
                    break
            
            if target_element:
                search_soup = target_element
                # 提取标题作为文件夹名
                title_text = target_element.get_text(strip=True)[:50]  # 取前50个字符作为标题
                date_folder = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_title = "".join(c for c in title_text if c.isalnum() or c in (' ', '-', '_')).strip()
                if safe_title:
                    page_folder = os.path.join(MEDIA_FOLDER, f"{date_folder}_{safe_title}")
                else:
                    page_folder = os.path.join(MEDIA_FOLDER, date_folder)
                    
                print(f"使用选择器: {used_selector}")
            else:
                # 调试：尝试找到相似的元素
                debug_info = []
                
                # 尝试分解选择器，逐步查找
                selectors_to_try = [
                    'div.post-content',
                    'div.dplayer-video-wrap', 
                    'video',
                    'div[class*="dplayer"]',
                    'div[class*="video"]'
                ]
                
                for selector in selectors_to_try:
                    elements = soup.select(selector)
                    if elements:
                        debug_info.append(f"找到 {len(elements)} 个 '{selector}' 元素")
                        # 显示前3个元素的class和id
                        for i, elem in enumerate(elements[:3]):
                            classes = elem.get('class', [])
                            elem_id = elem.get('id', '')
                            tag_name = elem.name
                            debug_info.append(f"  [{i+1}] <{tag_name}> class='{' '.join(classes)}' id='{elem_id}'")
                
                debug_text = "\n".join(debug_info) if debug_info else "未找到任何相关元素"
                
                return {
                    'success': False,
                    'error': f'未找到指定的CSS选择器: {css_selector}\n\n调试信息:\n{debug_text}'
                }
        else:
            search_soup = soup
            # 创建以日期命名的子文件夹
            date_folder = datetime.now().strftime("%Y%m%d_%H%M%S")
            page_folder = os.path.join(MEDIA_FOLDER, date_folder)
        
        os.makedirs(page_folder, exist_ok=True)
        
        # 自动下载所有图片
        img_tags = search_soup.find_all('img')
        for i, img in enumerate(img_tags):
            img_src = img.get('src') or img.get('data-src')
            if img_src:
                img_url = urljoin(page_url, img_src)
                try:
                    img_response = requests.get(img_url, headers=headers, timeout=10)
                    if img_response.status_code == 200:
                        # 获取文件扩展名
                        parsed_url = urlparse(img_url)
                        ext = os.path.splitext(parsed_url.path)[1]
                        if not ext:
                            ext = '.jpg'
                        
                        filename = f"image_{i+1:03d}{ext}"
                        filepath = os.path.join(page_folder, filename)
                        
                        with open(filepath, 'wb') as f:
                            f.write(img_response.content)
                        downloaded_files.append({
                            'type': 'image',
                            'filename': filename,
                            'url': img_url,
                            'size': len(img_response.content)
                        })
                        print(f"下载图片: {filename}")
                except Exception as e:
                    print(f"下载图片失败 {img_url}: {e}")
        
        # 自动下载所有视频 - 增强版，支持多种视频源
        video_tags = search_soup.find_all('video')
        video_sources = []
        
        # 查找标准video标签
        for video in video_tags:
            video_src = video.get('src') or video.get('data-src') or video.get('data-url')
            if video_src:
                video_sources.append(video_src)
        
        # 查找dplayer等自定义播放器的视频源
        dplayer_videos = search_soup.find_all(['div'], class_=lambda x: x and 'dplayer' in x.lower())
        for dplayer in dplayer_videos:
            # 查找data-video-url等属性
            video_url = (dplayer.get('data-video-url') or 
                        dplayer.get('data-src') or 
                        dplayer.get('data-url'))
            if video_url:
                video_sources.append(video_url)
        
        # 查找所有可能的视频URL模式
        import re
        page_text = str(search_soup)
        # 查找常见的视频URL模式
        video_patterns = [
            r'https?://[^\s"\'<>]+\.(mp4|avi|mov|wmv|flv|webm|mkv)',
            r'data-video-url=["\']([^"\']+)["\']',
            r'data-src=["\']([^"\']+\.(mp4|avi|mov|wmv|flv|webm|mkv))["\']'
        ]
        
        for pattern in video_patterns:
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    video_sources.append(match[0])
                else:
                    video_sources.append(match)
        
        # 去重并下载视频
        unique_video_sources = list(set(video_sources))
        for i, video_src in enumerate(unique_video_sources):
            video_url = urljoin(page_url, video_src)
            try:
                video_response = requests.get(video_url, headers=headers, timeout=30)
                if video_response.status_code == 200:
                    # 获取文件扩展名
                    parsed_url = urlparse(video_url)
                    ext = os.path.splitext(parsed_url.path)[1]
                    if not ext:
                        ext = '.mp4'
                    
                    filename = f"video_{i+1:03d}{ext}"
                    filepath = os.path.join(page_folder, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(video_response.content)
                    downloaded_files.append({
                        'type': 'video',
                        'filename': filename,
                        'url': video_url,
                        'size': len(video_response.content)
                    })
                    print(f"下载视频: {filename}")
            except Exception as e:
                print(f"下载视频失败 {video_url}: {e}")
        
        return {
            'success': True,
            'folder': page_folder,
            'files': downloaded_files,
            'total_files': len(downloaded_files)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route("/api/continue_story", methods=["POST"])
def continue_story():
    data = request.json
    current_story = data.get("story", "")
    try:
        next_part = deepseek_generate(current_story + "\n请续写下一段，约500字。")
        audio_file = tts_eleven(next_part)
        return jsonify({"next_part": next_part, "audio_url": f"/audio/{os.path.basename(audio_file)}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/audio/<filename>")
def serve_audio(filename):
    path = os.path.join(AUDIO_FOLDER, filename)
    return send_file(path)

@app.route("/api/background_music_list")
def background_music_list():
    # 你可以把这些音乐放static文件夹或者其他路径，示例这里直接写文件名
    music_files = [
        {"name": "轻快音乐", "url": "/static/bgm/mixkit-eyes-in-the-puddle-257.mp3"},
        {"name": "梦幻旋律", "url": "/static/bgm/mixkit-just-kidding-11.mp3"},
        {"name": "舒缓钢琴", "url": "/static/bgm/mixkit-keep-the-funk-on-1003.mp3"},
        {"name": "轻快音乐", "url": "/static/bgm/mixkit-lullbaby-1.mp3"},
        {"name": "梦幻旋律", "url": "/static/bgm/mixkit-my-little-star-1037.mp3"}, 
        {"name": "舒缓钢琴", "url": "/static/bgm/mixkit-random-667.mp3"}
        
    ]
    return jsonify(music_files)

@app.route("/api/download_media", methods=["POST"])
def download_media():
    """自动下载指定页面的所有视频和图片到本地文件夹，支持CSS选择器定位"""
    data = request.json
    page_url = data.get("url")
    css_selector = data.get("css_selector")  # 支持CSS选择器参数
    
    if not page_url:
        return jsonify({"error": "请提供页面URL"}), 400
    
    try:
        result = download_media_from_page(page_url, css_selector)
        if result['success']:
            return jsonify({
                "message": "下载完成",
                "folder": result['folder'],
                "files": result['files'],
                "total_files": result['total_files'],
                "css_selector": css_selector
            })
        else:
            return jsonify({"error": result['error']}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/media_list")
def media_list():
    """获取已下载的媒体文件列表"""
    try:
        if not os.path.exists(MEDIA_FOLDER):
            return jsonify({"folders": []})
        
        folders = []
        for folder_name in os.listdir(MEDIA_FOLDER):
            folder_path = os.path.join(MEDIA_FOLDER, folder_name)
            if os.path.isdir(folder_path):
                files = []
                for filename in os.listdir(folder_path):
                    file_path = os.path.join(folder_path, filename)
                    if os.path.isfile(file_path):
                        file_size = os.path.getsize(file_path)
                        file_type = 'video' if filename.lower().endswith(('.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm')) else 'image'
                        files.append({
                            'name': filename,
                            'type': file_type,
                            'size': file_size,
                            'path': file_path
                        })
                
                folders.append({
                    'name': folder_name,
                    'files': files,
                    'total_files': len(files)
                })
        
        # 按文件夹名称倒序排列（最新的在前）
        folders.sort(key=lambda x: x['name'], reverse=True)
        
        return jsonify({"folders": folders})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)
