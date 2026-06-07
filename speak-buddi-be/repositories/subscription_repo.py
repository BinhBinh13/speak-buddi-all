# speak-buddi-be/repositories/subscription_repo.py
# ─── Repository cho user_subscription (S8.2 — kích hoạt Paid User, BR04) ─────
#
# Tách khỏi user_repo.py (vốn về auth/profile) — gom logic kích hoạt/tra cứu
# subscription dùng ở luồng webhook thanh toán (UC10/AC-10-02).
#
# Pattern: raw SQL qua sqlalchemy.text() + AsyncSession, bám
# repositories/payment_repo.py / quiz_repo.py.
#
# "Paid User" là SUBSCRIPTION STATE, không phải role (BR04, SRS §4.5):
#   user_repo.get_is_paid() đọc user_subscription (status='active' AND
#   (expires_at IS NULL OR expires_at > NOW())) — activate_subscription() ở đây
#   ghi đúng các cột đó để get_is_paid trả True ngay sau khi commit.
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_active_subscription(db: AsyncSession, user_id: str) -> dict | None:
    """
    Lấy subscription đang active (chưa hết hạn) của user — dùng để cân nhắc
    gia hạn/cộng dồn thay vì tạo bản ghi mới khi user mua thêm trong lúc còn hạn.
    """
    r = await db.execute(
        text("""
            SELECT id::text, user_id::text, plan_id::text, status,
                   starts_at, expires_at, payment_ref
            FROM   user_subscription
            WHERE  user_id = CAST(:uid AS UUID)
              AND  status = 'active'
              AND  (expires_at IS NULL OR expires_at > NOW())
            ORDER  BY expires_at DESC NULLS FIRST
            LIMIT  1
        """),
        {"uid": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def activate_subscription(
    db: AsyncSession,
    user_id: str,
    plan_id: str,
    payment_ref: str,
    duration_days: int,
) -> dict:
    """
    Kích hoạt subscription cho user theo gói đã mua (AC-10-02, BR04):
    tạo `user_subscription` mới `status='active'`, `starts_at=NOW()`,
    `expires_at = NOW() + duration_days` (hoặc NULL nếu `duration_days <= 0`
    — gói lifetime/không giới hạn).

    Lưu ý gia hạn (S8.2 tối thiểu — ghi chú trade-off cho story sau):
    nếu user đã có subscription active CÙNG GÓI chưa hết hạn, cộng dồn
    `expires_at` (gia hạn nối tiếp) thay vì tạo bản ghi chồng — tránh user mua
    nhiều lần trong tháng bị "mất" thời gian còn lại. Nếu khác gói hoặc chưa có
    active → tạo bản ghi mới.

    Trả dict subscription (gồm `id`) để service gắn ngược
    `payment_transaction.user_subscription_id`.
    """
    existing = await get_active_subscription(db, user_id)

    if existing and existing["plan_id"] == plan_id:
        # Gia hạn nối tiếp: cộng dồn từ thời điểm hết hạn hiện tại (không "mất"
        # thời gian còn lại). Nếu plan hiện tại là lifetime (expires_at NULL)
        # → giữ nguyên NULL (không thể "cộng dồn" với vô hạn).
        r = await db.execute(
            text("""
                UPDATE user_subscription
                SET    status = 'active',
                       expires_at = CASE
                           WHEN expires_at IS NULL OR :duration <= 0 THEN NULL
                           ELSE expires_at + (:duration || ' days')::INTERVAL
                       END,
                       payment_ref = :ref
                WHERE  id = CAST(:sub_id AS UUID)
                RETURNING id::text, user_id::text, plan_id::text, status,
                          starts_at, expires_at, payment_ref
            """),
            {"sub_id": existing["id"], "duration": duration_days, "ref": payment_ref},
        )
        row = r.mappings().first()
        return dict(row)

    # Không có active cùng gói (lần đầu mua / đổi gói / đã hết hạn) → tạo mới.
    r = await db.execute(
        text("""
            INSERT INTO user_subscription
                (user_id, plan_id, status, starts_at, expires_at, payment_ref)
            VALUES (
                CAST(:uid AS UUID),
                CAST(:pid AS UUID),
                'active',
                NOW(),
                CASE WHEN :duration <= 0 THEN NULL ELSE NOW() + (:duration || ' days')::INTERVAL END,
                :ref
            )
            RETURNING id::text, user_id::text, plan_id::text, status,
                      starts_at, expires_at, payment_ref
        """),
        {"uid": user_id, "pid": plan_id, "duration": duration_days, "ref": payment_ref},
    )
    row = r.mappings().first()
    return dict(row)
