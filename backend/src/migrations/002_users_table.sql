CREATE TABLE IF NOT EXISTS users (
    id varchar(36) PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    password_hash varchar(255) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);
