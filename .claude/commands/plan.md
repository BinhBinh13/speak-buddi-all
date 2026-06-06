---
description: Lập kế hoạch triển khai cho một story (gọi planner agent) và cập nhật progress.json
argument-hint: <story-id>   (ví dụ S1.4)
allowed-tools: Task, Read, Write, Edit, Grep, Glob
---

Bạn đang chạy command **/plan** cho story: **$ARGUMENTS**

Thực hiện tuần tự:

1. **Xác thực story.** Mở `progress.json`, tìm story có `id` = `$ARGUMENTS`.
   - Nếu thiếu argument hoặc không tìm thấy → in danh sách story hợp lệ trong epic gần nhất và dừng.
   - Đọc `backlog.md` để lấy mô tả + AC nguồn của story này.

2. **Gọi Planner agent.** Dùng Task tool với `subagent_type: planner`, truyền: story id, tiêu đề, AC nguồn, epic. Yêu cầu agent đọc SRS/schema/diagram/code liên quan và ghi ra `plan/$ARGUMENTS-plan.md`.

3. **Cập nhật `progress.json`** theo *Hợp đồng cập nhật* trong [CLAUDE.md](../../CLAUDE.md) §5.1:
   - `story.status`: `todo` → `in_progress` (giữ nguyên nếu đang ở trạng thái cao hơn).
   - `story.artifacts.plan` = `"plan/$ARGUMENTS-plan.md"`.
   - `story.updatedAt` = ngày hiện tại.
   - Tính lại `epic.progressPercent`, `epic.status`, và `summary` (byStatus, completedStories, progressPercent).
   - `progress.lastUpdated` = ngày hiện tại. Giữ JSON 2-space indent.

4. **Báo cáo** ngắn gọn: đường dẫn plan, status mới của story, tóm tắt plan, và cảnh báo nếu Planner đề xuất `blocked`.