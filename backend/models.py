from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.sqlite import JSON

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True)
    password_hash = db.Column(db.String(128))
    avatar_url = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Item(db.Model):
    __tablename__ = 'item'
    item_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    type = db.Column(db.String(32))
    image_url = db.Column(db.String(256))
    style_tag = db.Column(db.String(32))
    price = db.Column(db.Float)
    description = db.Column(db.String(256))

class LookHistory(db.Model):
    __tablename__ = 'look_history'
    look_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'))
    look_image_url = db.Column(db.String(256))
    items = db.Column(JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Image(db.Model):
    __tablename__ = 'image'
    image_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'))
    url = db.Column(db.String(256))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    face_id = db.Column(db.String(64))

class StyleTag(db.Model):
    __tablename__ = 'style_tag'
    tag_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32), unique=True)
    description = db.Column(db.String(128)) 