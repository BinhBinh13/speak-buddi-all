-- Migration 012: thêm roadmap_sequence cho onboarding AI (S2.1 revised v2 — scenario-based)
-- Idempotent: ADD COLUMN IF NOT EXISTS

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS roadmap_sequence JSONB;

-- roadmap_sequence: ordered JSON array of scenario objects, ví dụ:
--   [
--     {"topic_id": "<uuid-greetings>", "scenario_name": "Chào hỏi người mới",
--      "scenario_description": "Tự giới thiệu và bắt đầu cuộc trò chuyện tự nhiên"},
--     {"topic_id": "<uuid-directions>", "scenario_name": "Hỏi đường & Di chuyển",
--      "scenario_description": "Hỏi và chỉ đường khi đi du lịch"}
--   ]
-- NULL = chưa sinh / user cũ → roadmap_repo fallback về sort theo difficulty,
--        scenario_name/scenario_description = None.
