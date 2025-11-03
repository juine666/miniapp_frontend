from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models import db
import os
from models import LookHistory
from datetime import datetime
import uuid
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
import base64
import requests
import time

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stylemirror.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)
db.init_app(app)

# 移除@app.before_first_request和create_tables

# 1. 上传图片 + 人脸识别
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    image_url = f"/static/uploads/{filename}"
    # TODO: 人脸识别逻辑
    return jsonify({
        "face_id": "abc123",
        "landmarks": {},
        "face_shape": "oval",
        "beauty_score": 7.8,
        "image_url": image_url
    })

# 2. 虚拟试穿
@app.route('/api/tryon', methods=['POST'])
def tryon():
    # TODO: 图像合成
    return jsonify({
        "result_image_url": "https://example.com/tryon_result.png"
    })

# 百度AI密钥（请替换为你的真实密钥）
BAIDU_API_KEY = 'Va5yQRHlA4Fq5eR3LT0vuXV4'
BAIDU_SECRET_KEY = '0rDSjzQ20XUj5itV6WRtznPQSzr5pVw2'

# 百度AccessToken缓存
_baidu_token = None
_baidu_token_expire = 0

def get_baidu_access_token():
    global _baidu_token, _baidu_token_expire
    if _baidu_token and _baidu_token_expire > time.time():
        return _baidu_token
    url = 'https://aip.baidubce.com/oauth/2.0/token'
    params = {
        'grant_type': 'client_credentials',
        'client_id': BAIDU_API_KEY,
        'client_secret': BAIDU_SECRET_KEY
    }
    resp = requests.post(url, params=params)
    data = resp.json()
    _baidu_token = data['access_token']
    _baidu_token_expire = time.time() + int(data.get('expires_in', 2592000)) - 60
    return _baidu_token

@app.route('/api/attractiveness', methods=['POST'])
def attractiveness():
    # 临时返回模拟数据，不调用百度API
    return jsonify({
        'score': 8.5,
        'age': 25,
        'gender': 'female',
        'face_shape': 'oval',
        'features': {
            'eyes': '状态:正常',
            'nose': '微笑',
            'mouth': '正常',
            'jaw': '椭圆形'
        },
        'suggested_style': ['温柔风', '日系小清新']
    })

# 4. 商品推荐
@app.route('/api/recommendations')
def recommendations():
    # TODO: 推荐逻辑
    return jsonify([
        {"item_id": "dress_001", "name": "连衣裙A"},
        {"item_id": "necklace_002", "name": "项链B"}
    ])

# 5. 保存搭配
@app.route('/api/save-look', methods=['POST'])
def save_look():
    data = request.json
    look = LookHistory(
        user_id=data.get('user_id'),
        look_image_url=data.get('look_image_url'),
        items=data.get('items'),
        timestamp=datetime.fromisoformat(data.get('timestamp')) if data.get('timestamp') else datetime.utcnow()
    )
    db.session.add(look)
    db.session.commit()
    return jsonify({"success": True, "look_id": look.look_id})

# 6. 获取历史搭配
@app.route('/api/look-history')
def look_history():
    user_id = request.args.get('user_id')
    looks = LookHistory.query.filter_by(user_id=user_id).order_by(LookHistory.timestamp.desc()).all()
    result = []
    for l in looks:
        result.append({
            "look_id": l.look_id,
            "look_image_url": l.look_image_url,
            "items": l.items,
            "timestamp": l.timestamp.isoformat()
        })
    return jsonify(result)

# 7. 分享搭配
@app.route('/api/share-look')
def share_look():
    look_id = request.args.get("look_id")
    return jsonify({"share_url": f"https://stylemirror.ai/share/{look_id}"})

# 用户注册
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': '用户名和密码必填'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': '用户名已存在'}), 400
    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({'user_id': user.user_id})

# 用户登录
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': '用户名或密码错误'}), 400
    return jsonify({'user_id': user.user_id})

@app.route('/api/ai-tryon', methods=['POST'])
def ai_tryon():
    model_file = request.files.get('model_image')
    cloth_file = request.files.get('cloth_image')
    if not model_file or not cloth_file:
        return jsonify({'error': '请上传模特图和服装图'}), 400
    files = {
        'model_image': (model_file.filename, model_file.stream, model_file.mimetype),
        'cloth_image': (cloth_file.filename, cloth_file.stream, cloth_file.mimetype)
    }
    headers = {'Authorization': f'Bearer {ZMO_API_KEY}'}
    # 具体API路径和参数以ZMO官方文档为准
    resp = requests.post('https://api.zmo.ai/v1/tryon', files=files, headers=headers)
    result = resp.json()
    if 'result_image_url' in result:
        return jsonify({'result_image_url': result['result_image_url']})
    return jsonify({'error': result.get('error', 'ZMO.AI调用失败')})

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 