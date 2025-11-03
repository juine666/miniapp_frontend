-- MySQL schema for StyleMirror (WeChat mini-program backend)
-- Execute in your MySQL database (e.g., `miniapp`) before running the app if you want explicit DDLs.

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(255),
  avatar_url VARCHAR(512),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  banned TINYINT(1) NOT NULL DEFAULT 0
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url VARCHAR(512),
  price DECIMAL(19,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id BIGINT,
  seller_id BIGINT,
  latitude DOUBLE,
  longitude DOUBLE,
  status VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_products_name (name),
  INDEX idx_products_category (category_id),
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_status (status)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  total_amount DECIMAL(19,2) NOT NULL,
  status VARCHAR(32),
  out_trade_no VARCHAR(64),
  prepay_id VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_orders_out_trade_no (out_trade_no)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(19,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order (order_id)
);

-- Media assets
CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  url VARCHAR(512),
  type VARCHAR(32),
  size_bytes BIGINT,
  owner_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Contact info
CREATE TABLE IF NOT EXISTS contact_info (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  phone VARCHAR(64),
  wechat_id VARCHAR(128),
  email VARCHAR(255),
  CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Share links
CREATE TABLE IF NOT EXISTS share_links (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(16) NOT NULL UNIQUE,
  product_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_share_product FOREIGN KEY (product_id) REFERENCES products(id)
);
















