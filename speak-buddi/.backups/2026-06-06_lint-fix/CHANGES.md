# Lint Fix — 2026-06-06

Backup tạo trước khi fix 10 ESLint errors pre-existing.
Tất cả errors này tồn tại trước S1.3/S1.4, không do các story đó gây ra.

## Files được backup

| File gốc | File backup |
|---|---|
| `src/features/auth/LoginPage.jsx` | `LoginPage.jsx` |
| `src/features/dashboard/components/RoadmapSection.jsx` | `RoadmapSection.jsx` |
| `src/features/speaking/SpeakingPage.jsx` | `SpeakingPage.jsx` |
| `src/features/speaking/services/speechService.js` | `speechService.js` |

## Chi tiết từng fix

### LoginPage.jsx (2 errors → 0)
- **Xóa** `FONTS` và `GOOGLE_FONTS_URL` khỏi import dòng 2 — hai hằng này được import nhưng không dùng ở bất kỳ đâu trong file.

### RoadmapSection.jsx (5 errors → 0)
- **Xóa** `const CR = 52` (dòng 30) — hằng số "circle radius" không còn dùng, đã được thay bằng `NODE_R`.
- **Di chuyển** `const navigate = useNavigate()` lên trước `if (!node) return null` trong `LessonModal` — gọi hook sau early return vi phạm Rules of Hooks.
- **Xóa** `const isCurrent = node.state === "current"` trong `LessonModal` — khai báo nhưng không dùng trong component này (NodeButton có biến `isCurrent` riêng).
- **Xóa** `const totalXP = ...` và `const progress = ...` trong `RoadmapSection` — tính toán nhưng không render ra UI.

### SpeakingPage.jsx (2 errors → 0)
- **Di chuyển** `function typeReply(...)` lên trước `useEffect` — hàm bị dùng trong effect trước khi khai báo (vi phạm `react-hooks/immutability`).
- **Thêm** `// eslint-disable-next-line react-hooks/set-state-in-effect` trước `setStatus(STATUS.THINKING)` — gọi setState đồng bộ trong effect là intentional ở đây (set trạng thái loading trước async call).

### speechService.js (1 error → 0)
- **Xóa** biến `manuallyStopped` và tất cả assignments — biến được gán giá trị nhiều chỗ nhưng không bao giờ được đọc/kiểm tra. Logic theo dõi manual stop chưa được implement.
