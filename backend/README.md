# StyleMirror.AI 后端API文档

## 1. 上传图片 + 人脸识别
- `POST /api/upload-image`
- 参数：multipart/form-data，字段名`image`
- 返回：face_id, landmarks, face_shape, beauty_score

## 2. 虚拟试穿
- `POST /api/tryon`
- 参数：JSON，face_id, item_id
- 返回：result_image_url

## 3. AI吸引力评分
- `POST /api/attractiveness`
- 参数：JSON，image_url
- 返回：score, face_shape, skin_tone, suggested_style

## 4. 商品推荐
- `GET /api/recommendations?face_shape=oval&style=清新`
- 返回：商品列表

## 5. 保存搭配
- `POST /api/save-look`
- 参数：JSON，user_id, look_image_url, items, timestamp
- 返回：success, look_id

## 6. 获取历史搭配
- `GET /api/look-history?user_id=xxx`
- 返回：look列表

## 7. 分享搭配
- `GET /api/share-look?look_id=xxx`
- 返回：share_url 