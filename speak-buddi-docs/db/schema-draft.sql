-- SpeakBuddi — MySQL Schema Draft for SRS Entities
-- Version: v1.0.0-draft
-- Purpose: Reference schema for requirements/entity validation, not final SDD database design.
-- Notes:
--   - Based on the user's existing schema direction: auth/profile/level/topic/vocab/progress/speaking/pronunciation.
--   - Adds missing entities required by SpeakBuddi v1.0.0 requirements: payment, subscription,
--     quiz/test, AI quota, ElevenLabs voice preference, translation history, report export history.
--   - Sample data is intentionally omitted and can be added later if needed.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS report_export_history;
DROP TABLE IF EXISTS translation_history;
DROP TABLE IF EXISTS user_voice_preference;
DROP TABLE IF EXISTS elevenlabs_voice_model;
DROP TABLE IF EXISTS ai_quota_window;
DROP TABLE IF EXISTS quiz_attempt_answer;
DROP TABLE IF EXISTS quiz_attempt;
DROP TABLE IF EXISTS quiz_answer;
DROP TABLE IF EXISTS quiz_question;
DROP TABLE IF EXISTS vocabulary_test;
DROP TABLE IF EXISTS payment_transaction;
DROP TABLE IF EXISTS user_subscription;
DROP TABLE IF EXISTS payment_plan;
DROP TABLE IF EXISTS pronunciation_syllable_score;
DROP TABLE IF EXISTS pronunciation_attempt;
DROP TABLE IF EXISTS speaking_session;
DROP TABLE IF EXISTS user_word_progress;
DROP TABLE IF EXISTS user_topic_progress;
DROP TABLE IF EXISTS topic_word_tag;
DROP TABLE IF EXISTS topic_word;
DROP TABLE IF EXISTS tag;
DROP TABLE IF EXISTS user_session;
DROP TABLE IF EXISTS oauth_account;
DROP TABLE IF EXISTS user_profile;
DROP TABLE IF EXISTS topic;
DROP TABLE IF EXISTS level;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1. Core Identity / Auth
-- =========================================================

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(150) NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create level/topic before user_profile because user_profile references them.
CREATE TABLE level (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_level_code (code),
  UNIQUE KEY uq_level_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topic (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  level_id BIGINT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_topic_slug (slug),
  UNIQUE KEY uq_topic_name (name),
  KEY idx_topic_level (level_id),
  CONSTRAINT fk_topic_level FOREIGN KEY (level_id) REFERENCES level(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profile (
  user_id BIGINT UNSIGNED NOT NULL,
  avatar_url VARCHAR(500) NULL,
  target_level_id BIGINT UNSIGNED NULL,
  current_topic_id BIGINT UNSIGNED NULL,
  learning_goal TEXT NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_user_profile_target_level (target_level_id),
  KEY idx_user_profile_current_topic (current_topic_id),
  CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_profile_level FOREIGN KEY (target_level_id) REFERENCES level(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_user_profile_topic FOREIGN KEY (current_topic_id) REFERENCES topic(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE oauth_account (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_provider_user (provider, provider_user_id),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_session (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_session_user (user_id),
  KEY idx_user_session_expires (expires_at),
  CONSTRAINT fk_user_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2. Learning Content / Roadmap Basis
-- Roadmap can be derived from ordered level/topic/topic_word/vocabulary_test data plus user progress.
-- =========================================================

CREATE TABLE tag (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_name (name),
  UNIQUE KEY uq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topic_word (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  level_id BIGINT UNSIGNED NULL,
  word VARCHAR(120) NOT NULL,
  phonetic VARCHAR(120) NULL,
  meaning_vi VARCHAR(500) NOT NULL,
  meaning_en VARCHAR(500) NULL,
  example_sentence VARCHAR(1000) NULL,
  audio_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_topic_word (topic_id, word),
  KEY idx_topic_word_topic (topic_id),
  KEY idx_topic_word_level (level_id),
  KEY idx_topic_word_created_by (created_by),
  CONSTRAINT fk_topic_word_topic FOREIGN KEY (topic_id) REFERENCES topic(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_topic_word_level FOREIGN KEY (level_id) REFERENCES level(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_topic_word_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topic_word_tag (
  topic_word_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (topic_word_id, tag_id),
  KEY idx_topic_word_tag_tag (tag_id),
  CONSTRAINT fk_topic_word_tag_word FOREIGN KEY (topic_word_id) REFERENCES topic_word(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_topic_word_tag_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_topic_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_topic_progress (user_id, topic_id),
  KEY idx_user_topic_progress_topic (topic_id),
  CONSTRAINT fk_user_topic_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_topic_progress_topic FOREIGN KEY (topic_id) REFERENCES topic(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (progress_percent >= 0 AND progress_percent <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_word_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_word_id BIGINT UNSIGNED NOT NULL,
  status ENUM('new', 'learning', 'mastered') NOT NULL DEFAULT 'new',
  last_practiced_at DATETIME NULL,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_word_progress (user_id, topic_word_id),
  KEY idx_user_word_progress_word (topic_word_id),
  CONSTRAINT fk_user_word_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_word_progress_word FOREIGN KEY (topic_word_id) REFERENCES topic_word(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3. Payment / Subscription / Paid User
-- =========================================================

CREATE TABLE payment_plan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  duration_days INT NULL,
  features JSON NULL,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_plan_code (code),
  KEY idx_payment_plan_created_by (created_by),
  CONSTRAINT fk_payment_plan_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (price >= 0),
  CHECK (duration_days IS NULL OR duration_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_subscription (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_plan_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active', 'expired', 'cancelled', 'pending') NOT NULL DEFAULT 'pending',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_subscription_user_status (user_id, status),
  KEY idx_user_subscription_plan (payment_plan_id),
  CONSTRAINT fk_user_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_subscription_plan FOREIGN KEY (payment_plan_id) REFERENCES payment_plan(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_transaction (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_plan_id BIGINT UNSIGNED NOT NULL,
  user_subscription_id BIGINT UNSIGNED NULL,
  provider VARCHAR(80) NOT NULL,
  provider_transaction_id VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  status ENUM('pending', 'success', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  failure_reason VARCHAR(500) NULL,
  paid_at DATETIME NULL,
  raw_payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_provider_tx (provider, provider_transaction_id),
  KEY idx_payment_transaction_user (user_id),
  KEY idx_payment_transaction_plan (payment_plan_id),
  KEY idx_payment_transaction_subscription (user_subscription_id),
  KEY idx_payment_transaction_status_paid_at (status, paid_at),
  CONSTRAINT fk_payment_transaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payment_transaction_plan FOREIGN KEY (payment_plan_id) REFERENCES payment_plan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_payment_transaction_subscription FOREIGN KEY (user_subscription_id) REFERENCES user_subscription(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 4. Vocabulary Test / Quiz
-- =========================================================

CREATE TABLE vocabulary_test (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  level_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vocabulary_test_topic (topic_id),
  KEY idx_vocabulary_test_level (level_id),
  KEY idx_vocabulary_test_created_by (created_by),
  CONSTRAINT fk_vocabulary_test_topic FOREIGN KEY (topic_id) REFERENCES topic(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_vocabulary_test_level FOREIGN KEY (level_id) REFERENCES level(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_vocabulary_test_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_question (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vocabulary_test_id BIGINT UNSIGNED NOT NULL,
  topic_word_id BIGINT UNSIGNED NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'fill_blank', 'listen_choose') NOT NULL DEFAULT 'multiple_choice',
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quiz_question_test (vocabulary_test_id),
  KEY idx_quiz_question_word (topic_word_id),
  CONSTRAINT fk_quiz_question_test FOREIGN KEY (vocabulary_test_id) REFERENCES vocabulary_test(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_question_word FOREIGN KEY (topic_word_id) REFERENCES topic_word(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_answer (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quiz_question_id BIGINT UNSIGNED NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quiz_answer_question (quiz_question_id),
  CONSTRAINT fk_quiz_answer_question FOREIGN KEY (quiz_question_id) REFERENCES quiz_question(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempt (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  vocabulary_test_id BIGINT UNSIGNED NOT NULL,
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  wrong_answers INT NOT NULL DEFAULT 0,
  score_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('in_progress', 'submitted') NOT NULL DEFAULT 'in_progress',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quiz_attempt_user (user_id),
  KEY idx_quiz_attempt_test (vocabulary_test_id),
  KEY idx_quiz_attempt_submitted (submitted_at),
  CONSTRAINT fk_quiz_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_attempt_test FOREIGN KEY (vocabulary_test_id) REFERENCES vocabulary_test(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (score_percent >= 0 AND score_percent <= 100),
  CHECK (total_questions >= 0),
  CHECK (correct_answers >= 0),
  CHECK (wrong_answers >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempt_answer (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quiz_attempt_id BIGINT UNSIGNED NOT NULL,
  quiz_question_id BIGINT UNSIGNED NOT NULL,
  quiz_answer_id BIGINT UNSIGNED NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quiz_attempt_question (quiz_attempt_id, quiz_question_id),
  KEY idx_quiz_attempt_answer_question (quiz_question_id),
  KEY idx_quiz_attempt_answer_answer (quiz_answer_id),
  CONSTRAINT fk_quiz_attempt_answer_attempt FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempt(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_attempt_answer_question FOREIGN KEY (quiz_question_id) REFERENCES quiz_question(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_attempt_answer_answer FOREIGN KEY (quiz_answer_id) REFERENCES quiz_answer(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 5. Speaking / Pronunciation / AI Quota / ElevenLabs Voice
-- =========================================================

CREATE TABLE elevenlabs_voice_model (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_voice_id VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  gender VARCHAR(50) NULL,
  accent VARCHAR(80) NULL,
  preview_audio_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_elevenlabs_provider_voice (provider_voice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_voice_preference (
  user_id BIGINT UNSIGNED NOT NULL,
  elevenlabs_voice_model_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_user_voice_preference_voice (elevenlabs_voice_model_id),
  CONSTRAINT fk_user_voice_preference_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_voice_preference_voice FOREIGN KEY (elevenlabs_voice_model_id) REFERENCES elevenlabs_voice_model(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_quota_window (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  window_start_at DATETIME NOT NULL,
  window_end_at DATETIME NOT NULL,
  used_seconds INT NOT NULL DEFAULT 0,
  max_seconds INT NOT NULL DEFAULT 900,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ai_quota_window_user_start (user_id, window_start_at),
  KEY idx_ai_quota_window_user_end (user_id, window_end_at),
  CONSTRAINT fk_ai_quota_window_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (used_seconds >= 0),
  CHECK (max_seconds = 900)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE speaking_session (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NULL,
  focus_word_id BIGINT UNSIGNED NULL,
  elevenlabs_voice_model_id BIGINT UNSIGNED NULL,
  ai_quota_window_id BIGINT UNSIGNED NULL,
  session_type ENUM('ai_conversation', 'word_conversation', 'pronunciation') NOT NULL DEFAULT 'ai_conversation',
  status ENUM('started', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'started',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  is_quota_counted BOOLEAN NOT NULL DEFAULT TRUE,
  user_transcript TEXT NULL,
  ai_feedback TEXT NULL,
  error_code VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_speaking_session_user_started (user_id, started_at),
  KEY idx_speaking_session_topic (topic_id),
  KEY idx_speaking_session_word (focus_word_id),
  KEY idx_speaking_session_voice (elevenlabs_voice_model_id),
  KEY idx_speaking_session_quota_window (ai_quota_window_id),
  CONSTRAINT fk_speaking_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_speaking_session_topic FOREIGN KEY (topic_id) REFERENCES topic(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_speaking_session_word FOREIGN KEY (focus_word_id) REFERENCES topic_word(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_speaking_session_voice FOREIGN KEY (elevenlabs_voice_model_id) REFERENCES elevenlabs_voice_model(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_speaking_session_quota_window FOREIGN KEY (ai_quota_window_id) REFERENCES ai_quota_window(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (duration_seconds >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pronunciation_attempt (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_word_id BIGINT UNSIGNED NULL,
  speaking_session_id BIGINT UNSIGNED NULL,
  target_text VARCHAR(1000) NOT NULL,
  audio_url VARCHAR(500) NULL,
  overall_score DECIMAL(5,2) NULL,
  accuracy_score DECIMAL(5,2) NULL,
  fluency_score DECIMAL(5,2) NULL,
  feedback TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pronunciation_attempt_user (user_id),
  KEY idx_pronunciation_attempt_word (topic_word_id),
  KEY idx_pronunciation_attempt_session (speaking_session_id),
  CONSTRAINT fk_pronunciation_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pronunciation_attempt_word FOREIGN KEY (topic_word_id) REFERENCES topic_word(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pronunciation_attempt_session FOREIGN KEY (speaking_session_id) REFERENCES speaking_session(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 100)),
  CHECK (fluency_score IS NULL OR (fluency_score >= 0 AND fluency_score <= 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pronunciation_syllable_score (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pronunciation_attempt_id BIGINT UNSIGNED NOT NULL,
  syllable_text VARCHAR(100) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pronunciation_syllable_attempt (pronunciation_attempt_id),
  CONSTRAINT fk_pronunciation_syllable_attempt FOREIGN KEY (pronunciation_attempt_id) REFERENCES pronunciation_attempt(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (score >= 0 AND score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 6. Translation / Reporting
-- =========================================================

CREATE TABLE translation_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  source_text VARCHAR(1000) NOT NULL,
  translated_text VARCHAR(2000) NOT NULL,
  source_language VARCHAR(20) NOT NULL DEFAULT 'en',
  target_language VARCHAR(20) NOT NULL DEFAULT 'vi',
  topic_word_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_translation_history_user_created (user_id, created_at),
  KEY idx_translation_history_word (topic_word_id),
  CONSTRAINT fk_translation_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_translation_history_word FOREIGN KEY (topic_word_id) REFERENCES topic_word(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_export_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NOT NULL,
  report_type ENUM('revenue', 'users', 'learning', 'ai_usage') NOT NULL,
  export_format ENUM('xlsx', 'pdf') NOT NULL,
  filter_params JSON NULL,
  file_url VARCHAR(500) NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  error_message VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_report_export_admin_created (admin_user_id, created_at),
  KEY idx_report_export_type (report_type),
  CONSTRAINT fk_report_export_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of SRS reference schema draft.
