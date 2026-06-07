---
name: review-story
description: Đánh giá (review) một story speak-buddi sau khi đã implement (vd "review S1.4", "đánh giá story S2.3", "/review S4.2"). Gọi subagent reviewer để đối chiếu code với plan + AC, chạy lint/test, kết luận PASS/CHANGES_REQUESTED/FAIL, ghi review/<id>-review.md, rồi cập nhật progress.json. Dùng SAU khi đã implement xong.
---

# Skill: Review story

Tương đương lệnh `/review <story-id>` của bộ `.claude/commands` trong dự án này. Kích hoạt khi user muốn review/đánh giá một story đã code xong, ví dụ: "review S1.4", "đánh giá giúp S2.3", "/review S4.2".

## Quy trình (làm tuần tự, không bỏ bước)

1. **Tiền điều kiện.**
   - Lấy `<story-id>` từ yêu cầu của user. Mở `progress.json`, tìm story `<story-id>`.
   - Không tìm thấy → liệt kê story hợp lệ rồi dừng.
   - Kiểm tra tồn tại `implement/<story-id>-implement.md`. Nếu CHƯA có → báo user cần chạy skill **implement-story** cho `<story-id>` trước, rồi dừng.

2. **Giao việc cho subagent `reviewer`** (định nghĩa ở `.codex/agents/reviewer.toml`): truyền story id + đường dẫn `plan/<story-id>-plan.md` + `implement/<story-id>-implement.md`. Yêu cầu agent đối chiếu code thật với AC, tự chạy lint/test, và ghi `review/<story-id>-review.md` với verdict PASS / CHANGES_REQUESTED / FAIL.
   - Nếu môi trường không spawn được subagent, tự đóng vai Reviewer và làm đúng theo nội dung `developer_instructions` trong `.codex/agents/reviewer.toml`.

3. **Cập nhật `progress.json`** theo *Hợp đồng cập nhật* trong [`CLAUDE.md`](../../../CLAUDE.md) §5.1:
   - Verdict **PASS** → `story.status` = `done`.
   - Verdict **CHANGES_REQUESTED** / **FAIL** → `story.status` = `in_progress`, ghi tóm tắt việc cần sửa vào `story.notes`.
   - `story.artifacts.review` = `"review/<story-id>-review.md"`.
   - `story.updatedAt` = ngày hiện tại.
   - Tính lại `epic.progressPercent`, `epic.status`, và `summary` (đặc biệt `completedStories` + `progressPercent` khi PASS).
   - `progress.lastUpdated` = ngày hiện tại. Giữ JSON 2-space indent.

4. **Báo cáo ngắn gọn cho user:** verdict, AC đạt/không đạt, danh sách việc cần làm nếu chưa PASS, status mới, và % tiến độ epic/tổng thể sau cập nhật.

## Lưu ý
- Reviewer KHÔNG được tự sửa code — chỉ review. Nếu CHANGES_REQUESTED/FAIL, gợi ý user chạy lại skill **implement-story** (hoặc **plan-story** nếu FAIL — verdict cho thấy cần lập lại kế hoạch).
