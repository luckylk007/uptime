-- UptimePro MySQL Schema
-- Run this once against your MySQL 8.x database

CREATE DATABASE IF NOT EXISTS uptimepro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uptimepro;

CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitors (
  id               CHAR(36)   NOT NULL PRIMARY KEY,
  user_id          CHAR(36)   NOT NULL,
  url              TEXT       NOT NULL,
  interval_minutes TINYINT    NOT NULL DEFAULT 5,
  enabled          TINYINT(1) NOT NULL DEFAULT 1,
  created_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_monitor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_monitors_user_id (user_id),
  INDEX idx_monitors_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checks_log (
  id               CHAR(36)   NOT NULL PRIMARY KEY,
  monitor_id       CHAR(36)            NULL,
  url              TEXT       NOT NULL,
  status           ENUM('UP','DOWN','TIMEOUT','ERROR') NOT NULL,
  http_status      SMALLINT            NULL,
  response_time_ms INT        NOT NULL DEFAULT 0,
  final_url        TEXT       NOT NULL,
  error            TEXT               NULL,
  checked_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_check_monitor FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE,
  INDEX idx_checks_monitor_checked (monitor_id, checked_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidents (
  id               CHAR(36)   NOT NULL PRIMARY KEY,
  monitor_id       CHAR(36)   NOT NULL,
  url              TEXT       NOT NULL,
  status           ENUM('DOWN','DEGRADED') NOT NULL,
  cause            TEXT       NOT NULL,
  started_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at      DATETIME            NULL,
  duration_seconds INT                 NULL,
  CONSTRAINT fk_incident_monitor FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE,
  INDEX idx_incidents_monitor_open (monitor_id, resolved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
