# StyleMirror.AI 数据库设计

## 用户表 user
- user_id (主键)
- username
- email
- password_hash
- avatar_url
- created_at

## 商品表 item
- item_id (主键)
- name
- type (dress/necklace/earring/hair etc)
- image_url
- style_tag
- price
- description

## 搭配历史表 look_history
- look_id (主键)
- user_id (外键)
- look_image_url
- items (JSON数组: [item_id,...])
- timestamp

## 图片表 image
- image_id (主键)
- user_id (外键)
- url
- uploaded_at
- face_id (可选)

## 推荐标签表 style_tag
- tag_id (主键)
- name
- description 