---
name: implement-story
description: Triển khai (code) một story speak-buddi theo plan đã có (vd "implement S1.4", "code story S2.3", "/implement S4.2"). Gọi subagent developer để sửa code thật trong FE/BE, ghi implement/<id>-implement.md, rồi cập nhật progress.json. Dùng SAU khi đã có plan/<id>-plan.md.
---

# Skill: Implement story

Tương đương lệnh `/implement <story-id>` của bộ `.claude/commands` trong dự án này. Kích hoạt khi user muốn code/triển khai một story đã có plan, ví dụ: "implement S1.4", "code tiếp S2.3", "/implement S4.2".

## Quy trình (làm tuần tự, không bỏ bước)

1. **Tiền điều kiện.**
   - Lấy `<story-id>` từ yêu cầu của user. Mở `progress.json`, tìm story `<story-id>`.
   - Không tìm thấy → liệt kê story hợp lệ rồi dừng.
   - Kiểm tra tồn tại `plan/<story-id>-plan.md`. Nếu CHƯA có → báo user cần chạy skill **plan-story** cho `<story-id>` trước, rồi dừng (không tự bịa plan).
   - Nếu story đang `todo` → nhắc rằng chưa có plan chính thức trong `progress.json`; vẫn cho phép tiếp tục nếu file plan đã tồn tại trên đĩa.

2. **Giao việc cho subagent `developer`** (định nghĩa ở `.codex/agents/developer.toml`): truyền story id + đường dẫn `plan/<story-id>-plan.md`. Yêu cầu agent code thật trong `speak-buddi/` (FE) và/hoặc `speak-buddi-be/` (BE) đúng theo plan — kể cả tham chiếu mockup UI trong `speak-buddi-docs/ui/` nếu story có màn hình (xem bảng ánh xạ ở `CLAUDE.md` §6.2) — rồi ghi `implement/<story-id>-implement.md`.
   - Nếu môi trường không spawn được subagent, tự đóng vai Developer và làm đúng theo nội dung `developer_instructions` trong `.codex/agents/developer.toml`.

3. **Cập nhật `progress.json`** theo *Hợp đồng cập nhật* trong [`CLAUDE.md`](../../../CLAUDE.md) §5.1:
   - `story.status`: `in_progress` → `review` nếu Developer báo **Hoàn thành**. Nếu báo **Một phần** → giữ `in_progress`. Nếu **Blocked** → `blocked` + ghi lý do vào `story.notes`.
   - `story.artifacts.implement` = `"implement/<story-id>-implement.md"`.
   - `story.updatedAt` = ngày hiện tại.
   - Tính lại `epic.progressPercent`, `epic.status`, và `summary`.
   - `progress.lastUpdated` = ngày hiện tại. Giữ JSON 2-space indent.

4. **Báo cáo ngắn gọn cho user:** file đã thay đổi, kết quả lint/test, AC chưa đạt (nếu có), status mới, và gợi ý chạy tiếp skill **review-story** cho story này.

## Lưu ý
- KHÔNG commit/push trừ khi user yêu cầu rõ ràng.
- Không log password/token/secret/audio (SRS §4.5).
