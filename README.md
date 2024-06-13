

CREATE TABLE register (
    id VARCHAR(20) NOT NULL PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(5) NOT NULL,
    rs_number VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birth DATETIME
)

CREATE TABLE article (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    seat_info VARCHAR(255) NOT NULL,
    game_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES register(id)
);

CREATE TABLE chat_room (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES article(id)
);

CREATE TABLE chat_message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    sender_id VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_room(id),
    FOREIGN KEY (sender_id) REFERENCES register(id)
);

CREATE TABLE chat_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  user1_id VARCHAR(20) NOT NULL,
  user2_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES article(id),
  FOREIGN KEY (user1_id) REFERENCES register(id),
  FOREIGN KEY (user2_id) REFERENCES register(id)
);