-- Migration 004: thêm cột difficulty vào topic
-- Mục đích: lưu độ khó của topic (1 = dễ nhất), dùng để sắp xếp roadmap
-- Idempotent — chạy nhiều lần không lỗi

ALTER TABLE topic
  ADD COLUMN IF NOT EXISTS difficulty SMALLINT NOT NULL DEFAULT 1;

-- Khởi tạo difficulty = display_order cho data hiện có
-- (display_order đã biểu thị thứ tự, dùng làm giá trị khởi đầu hợp lý)
UPDATE topic SET difficulty = display_order WHERE difficulty = 1 AND display_order > 1;

CREATE INDEX IF NOT EXISTS idx_topic_difficulty
  ON topic (level_id, difficulty);
