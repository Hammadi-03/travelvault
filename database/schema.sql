-- ============================================================
-- TravelVault – MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS travelvault
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE travelvault;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)     NOT NULL PRIMARY KEY,  -- UUID v4
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    avatar_url    TEXT         DEFAULT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Media ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
    id            CHAR(36)     NOT NULL PRIMARY KEY,  -- UUID v4
    user_id       CHAR(36)     NOT NULL,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL UNIQUE,        -- relative path inside /uploads
    file_type     ENUM('image','video') NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    file_size     BIGINT       NOT NULL,
    width         INT          DEFAULT NULL,
    height        INT          DEFAULT NULL,
    duration      DECIMAL(10,3) DEFAULT NULL,          -- seconds for video
    public_url    TEXT         NOT NULL,
    thumbnail_url TEXT         DEFAULT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_media_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_media_user_id   (user_id),
    INDEX idx_media_created   (created_at DESC),
    INDEX idx_media_file_type (file_type),
    INDEX idx_media_file_name (file_name)  -- used for LIKE searches
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
