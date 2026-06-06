---
description: Triển khai một story theo kế hoạch đã có (gọi developer agent) và cập nhật progress.json
argument-hint: <story-id>   (ví dụ S1.4)
allowed-tools: Task, Read, Write, Edit, Grep, Glob, Bash
---

Bạn đang chạy command **/implement** cho story: **$ARGUMENTS**

Thực hiện tuần tự:

1. **Tiền điều kiện.** Mở `progress.json`, tìm story `$ARGUMENTS`.
   - Nếu không tìm thấy → in danh sách story hợp lệ và dừng.
   - Kiểm tra tồn tại `plan/$ARGUMENTS-plan.md`. Nếu chưa có → báo cần chạy `/plan $ARGUMENTS` trước và dừng.
   - Nếu story đang `todo` → nhắc rằng chưa plan; vẫn cho phép nếu plan file tồn tại.

2. **Gọi Developer agent.** Dùng Task tool với `subagent_type: developer`, truyền story id + đường dẫn plan. Yêu cầu agent code thật trong `speak-buddi/` (FE) và/hoặc `speak-buddi-be/` (BE) theo plan, rồi ghi `implement/$ARGUMENTS-implement.md`.

3. **Cập nhật `progress.json`** theo *Hợp đồng cập nhật* trong [CLAUDE.md](../../CLAUDE.md) §5.1:
   - `story.status`: `in_progress` → `review` (nếu Developer báo Hoàn thành). Nếu báo *Một phần* → giữ `in_progress`. Nếu *Blocked* → `blocked` + ghi lý do vào `story.notes`.
   - `story.artifacts.implement` = `"implement/$ARGUMENTS-implement.md"`.
   - `story.updatedAt` = ngày hiện tại.
   - Tính lại `epic.progressPercent`, `epic.status`, và `summary`.
   - `progress.lastUpdated` = ngày hiện tại. Giữ JSON 2-space indent.

4. **Báo cáo** ngắn gọn: file thay đổi, kết quả lint/test, AC chưa đạt (nếu có), status mới, và gợi ý chạy `/review $ARGUMENTS`