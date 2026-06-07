---
name: plan-story
description: Lập kế hoạch triển khai cho một story speak-buddi (vd "lập plan cho S1.4", "plan story S2.3", "/plan S4.2"). Đọc backlog + SRS, sinh plan/<id>-plan.md qua subagent planner, rồi cập nhật progress.json. Dùng TRƯỚC khi code một story.
---

# Skill: Plan story

Tương đương lệnh `/plan <story-id>` của bộ `.claude/commands` trong dự án này. Kích hoạt khi user muốn lập kế hoạch (plan) cho một story trước khi code, ví dụ: "lập plan cho S1.4", "plan giúp S2.3", "/plan S4.2".

## Quy trình (làm tuần tự, không bỏ bước)

1. **Xác thực story.**
   - Lấy `<story-id>` từ yêu cầu của user (vd `S1.4`). Thiếu thì hỏi lại user.
   - Mở `progress.json`, tìm story có `id = <story-id>` trong `epics[].stories[]`.
   - Không tìm thấy → liệt kê các story hợp lệ trong epic gần nhất rồi dừng.
   - Đọc `backlog.md` để lấy mô tả + AC nguồn + epic của story này.

2. **Giao việc cho subagent `planner`** (định nghĩa ở `.codex/agents/planner.toml`): truyền story id, tiêu đề, AC nguồn, epic. Yêu cầu agent đọc SRS (`speak-buddi-docs/SRS_speak-buddi_v1.1.0.md`), schema/diagram, mockup UI (nếu có) và code liên quan, rồi ghi ra `plan/<story-id>-plan.md`.
   - Nếu môi trường không spawn được subagent, tự đóng vai Planner và làm đúng theo nội dung `developer_instructions` trong `.codex/agents/planner.toml`.

3. **Cập nhật `progress.json`** theo *Hợp đồng cập nhật* trong [`CLAUDE.md`](../../../CLAUDE.md) §5.1:
   - `story.status`: `todo` → `in_progress` (giữ nguyên nếu đang ở trạng thái cao hơn).
   - `story.artifacts.plan` = `"plan/<story-id>-plan.md"` (tạo object `artifacts` nếu story chưa có).
   - `story.updatedAt` = ngày hiện tại (YYYY-MM-DD).
   - Tính lại `epic.progressPercent`, `epic.status`.
   - Tính lại `summary` (`byStatus`, `completedStories`, `progressPercent`).
   - `progress.lastUpdated` = ngày hiện tại. Giữ nguyên format JSON 2-space indent, không xoá field có sẵn.

4. **Báo cáo ngắn gọn cho user:** đường dẫn file plan, status mới của story, tóm tắt plan 2-3 dòng, và cảnh báo nếu Planner đề xuất `blocked`.

## Lưu ý
- KHÔNG code khi chạy skill này — chỉ lập kế hoạch + cập nhật `progress.json`.
- Sau khi xong, gợi ý user chạy tiếp skill **implement-story** cho story này.
