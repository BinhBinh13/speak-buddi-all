# speak-buddi-be/repositories/roadmap_repo.py
# ─── Repository: sinh roadmap cá nhân hóa (S2.2) ─────────────────────────────
#
# Hàm chính: get_roadmap(db, user_id)
#   1. Đọc user_profile.target_level + interests
#   2. Query topic active thuộc level đó, kèm word_count (subquery COUNT)
#   3. Sắp xếp: interests-first → display_order → name (BR09/AC-04-01)
#   4. Trả dict để router map sang RoadmapOut
#
# Không lưu bảng riêng — computed on-the-fly (quyết định kiến trúc S2.2 §3).
# ─────────────────────────────────────────────────────────────────────────────

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.roadmap_repo")


async def get_profile_for_roadmap(db: AsyncSession, user_id: str) -> dict | None:
    """Lấy target_level và interests từ user_profile.
    Trả None nếu không tìm thấy user.
    """
    r = await db.execute(
        text("""
            SELECT p.target_level, COALESCE(p.interests, ARRAY[]::TEXT[]) AS interests
            FROM   user_profile p
            WHERE  p.user_id = CAST(:uid AS UUID)
        """),
        {"uid": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_roadmap_topics(
    db: AsyncSession,
    level_code: str,
    interests: list[str],
) -> list[dict]:
    """Query topic active thuộc level_code.
    interests: list slug/name từ user_profile.interests — dùng để đánh dấu is_interest.
    Sắp xếp: topics trong interests lên trước (interest-first), rồi display_order, rồi name.
    word_count: đếm topic_word active (subquery) — không có cột riêng trong schema.
    Chỉ trả topic is_active = TRUE (AC-04-02 / BR11).
    """
    r = await db.execute(
        text("""
            SELECT
                t.id::text                    AS id,
                t.name,
                t.slug,
                t.description,
                t.difficulty,
                l.code                        AS level_code,
                l.name                        AS level_name,
                (
                    SELECT COUNT(*)
                    FROM   topic_word tw
                    WHERE  tw.topic_id  = t.id
                      AND  tw.is_active = TRUE
                )                             AS word_count,
                (t.slug = ANY(:interests) OR t.name = ANY(:interests)) AS is_interest
            FROM  topic  t
            JOIN  level  l ON t.level_id = l.id
            WHERE l.code      = UPPER(:level_code)
              AND t.is_active = TRUE
            ORDER BY
                t.difficulty ASC,
                t.name
        """),
        {"level_code": level_code, "interests": interests},
    )
    rows = r.mappings().all()
    return [dict(row) for row in rows]


async def get_roadmap(db: AsyncSession, user_id: str) -> dict | None:
    """Hàm tổng hợp: lấy profile + sinh danh sách node roadmap.

    Trả về:
        {
            "level":           str | None,   # target_level hoặc None nếu chưa onboard
            "level_name":      str | None,
            "total_topics":    int,
            "selected_topics": int,
            "nodes":           list[dict],   # mỗi dict khớp RoadmapNode
        }
    Trả None nếu user_id không tồn tại trong user_profile.
    Trả dict với nodes=[] nếu chưa onboard HOẶC không có topic active (AC-04-04).
    """
    profile = await get_profile_for_roadmap(db, user_id)
    if profile is None:
        return None  # user_profile không tồn tại

    target_level = profile.get("target_level")
    interests: list[str] = list(profile.get("interests") or [])

    # Chưa onboarding — trả empty roadmap, không raise lỗi (plan §3, AC-04-04 flow)
    if not target_level:
        return {
            "level":           None,
            "level_name":      None,
            "total_topics":    0,
            "selected_topics": 0,
            "nodes":           [],
        }

    topics = await get_roadmap_topics(db, target_level, interests)

    nodes: list[dict] = []
    for idx, t in enumerate(topics):
        nodes.append({
            "id":          t["id"],
            "name":        t["name"],
            "slug":        t["slug"],
            "description": t.get("description"),
            "order_index": idx,
            "difficulty":  int(t["difficulty"]),
            "is_interest": bool(t["is_interest"]),
            "status":      "available",   # placeholder — tracking story sau
            "word_count":  int(t["word_count"]),
        })

    level_name = topics[0]["level_name"] if topics else _default_level_name(target_level)
    selected = sum(1 for n in nodes if n["is_interest"])

    return {
        "level":           target_level,
        "level_name":      level_name,
        "total_topics":    len(nodes),
        "selected_topics": selected,
        "nodes":           nodes,
    }


# ─── Helper: tên level mặc định khi không có topic ─────────────────────────
_LEVEL_NAMES: dict[str, str] = {
    "A1": "Beginner (A1)",
    "A2": "Elementary (A2)",
    "B1": "Intermediate (B1)",
    "B2": "Upper-Intermediate (B2)",
    "C1": "Advanced (C1)",
    "C2": "Proficiency (C2)",
}


def _default_level_name(code: str) -> str:
    return _LEVEL_NAMES.get(code.upper(), code)
