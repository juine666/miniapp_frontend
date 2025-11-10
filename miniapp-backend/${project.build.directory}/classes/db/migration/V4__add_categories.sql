-- 添加三个分类：儿童玩具，日用百货，衣服
-- 如果分类已存在则忽略

INSERT INTO categories (name, description) VALUES ('儿童玩具', '各类儿童玩具') 
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO categories (name, description) VALUES ('日用百货', '日常生活用品') 
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO categories (name, description) VALUES ('衣服', '服装服饰') 
ON DUPLICATE KEY UPDATE name = name;

