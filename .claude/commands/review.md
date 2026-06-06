---
description: Đánh giá một story sau khi triển khai (gọi reviewer agent) và cập nhật progress.json
argument-hint: <story-id>   (ví dụ S1.4)
allowed-tools: Task, Read, Write, Edit, Grep, Glob, Bash
---

Bạn đang chạy command **/review** cho story: **$ARGUMENTS**

Thực hiện tuần tự:

1. **Tiền điều kiện.** Mở `progress.json`, tìm story `$ARGUMENTS`.
   - Nếu không tìm thấy → in danh sách story hợp lệ và dừng.
   - Kiểm tra tồn tại `implement/$ARGUMENTS-implement.md`. Nếu chưa có → báo cần chạy `/implement $ARGUMENTS` trước và dừng.

2. **Gọi Reviewer agent.** Dùng Task tool với `subagent_type: reviewer`, truyền story id + đường dẫn plan + implement log. Yêu cầu agent đối chiếu code thật với AC, chạy lint/test, và ghi `review/$ARGUMENTS-review.md` với verdict PASS / CHANGES_REQUESTED / FAIL.

3. **Cập nhật `progress.json`** theo *Hợp đồng cập nhật* trong [CLAUDE.md](../../CLAUDE.md) §5.1:
   - Verdict **PASS** → `story.status` = `done`.
   - Verdict **CHANGES_REQUESTED** / **FAIL** → `story.status` = `in_progress`, ghi tóm tắt việc cần sửa vào `story.notes`.
   - `story.artifacts.review` = `"review/$ARGUMENTS-review.md"`.
   - `story.updatedAt` = ngày hiện tại.
   - Tính lại `epic.progressPercent`, `epic.status`, và `summary` (đặc biệt `completedStories` + `progressPercent` khi PASS).
   - `progress.lastUpdated` = ngày hiện tại. Giữ JSON 2-space indent.

4. **Báo cáo** ngắn gọn: verdict, AC đạt/không đạt, danh sách việc cần làm nếu chưa PASS, status mới, và % tiến độ epic/tổng thể sau cập nhật.