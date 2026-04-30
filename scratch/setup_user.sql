CREATE USER IF NOT EXISTS 'bicrypto'@'localhost' IDENTIFIED BY 'bicrypto';
GRANT ALL PRIVILEGES ON v4.* TO 'bicrypto'@'localhost';
FLUSH PRIVILEGES;
