# speak-buddi-be/repositories/roadmap_repo.py
# ─── Repository: sinh roadmap cá nhân hóa (S2.2, updated S2.1 v2) ─────────────
#
# Hàm chính: get_roadmap(db, user_id)
#   1. Đọc user_profile.target_level + interests + roadmap_sequence (S2.1 v2)
#   2. Query topic active thuộc level đó, kèm word_count (subquery COUNT)
#   3. Nếu roadmap_sequence không NULL → reorder nodes theo sequence + gắn
#      scenario_name/scenario_description; append topic bỏ sót cuối.
#   4. Nếu roadmap_sequence NULL → fallback: ORDER BY difficulty (behavior cũ).
#   5. Trả dict để router map sang RoadmapOut
#
# Backward-compat: user cũ có roadmap_sequence=NULL → vẫn trả roadmap bình thường,
#   scenario_name/scenario_description=None cho tất cả node.
# ─────────────────────────────────────────────────────────────────────────────

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.roadmap_repo")


async def get_profile_for_roadmap(db: AsyncSession, user_id: str) -> dict | None:
    """Lấy target_level, learning_goal, interests và roadmap_sequence từ user_profile.
    Trả None nếu không tìm thấy user.
    """
    r = await db.execute(
        text("""
            SELECT p.target_level,
                   p.learning_goal,
                   COALESCE(p.interests, ARRAY[]::TEXT[]) AS interests,
                   p.roadmap_sequence
            FROM   user_profile p
            WHERE  p.user_id = CAST(:uid AS UUID)
        """),
        {"uid": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


def _compute_topic_status(
    total_words: int,
    known_count: int,
    progress_count: int,
    has_active_session: bool,
    in_user_topics: bool,
) -> str:
    """Xác định trạng thái node roadmap theo tiến độ học thực tế."""
    if total_words > 0 and known_count >= total_words:
        return "completed"
    if has_active_session or progress_count > 0 or in_user_topics:
        return "in_progress"
    return "available"


async def get_roadmap_topics(
    db: AsyncSession,
    level_code: str,
    interests: list[str],
    user_id: str | None = None,
) -> list[dict]:
    """Query topic active thuộc level_code.
    interests: list slug/name từ user_profile.interests — dùng để đánh dấu is_interest.
    Sắp xếp: difficulty ASC rồi name (S2.1 v2 sẽ reorder theo sequence nếu có).
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
                (t.slug = ANY(:interests) OR t.name = ANY(:interests)) AS is_interest,
                COALESCE((
                    SELECT COUNT(uwp.id) FILTER (WHERE uwp.status = 'known')
                    FROM   topic_word tw2
                    JOIN   user_word_progress uwp
                           ON uwp.topic_word_id = tw2.id
                          AND uwp.user_id       = CAST(:uid AS UUID)
                    WHERE  tw2.topic_id  = t.id
                      AND  tw2.is_active = TRUE
                ), 0)                         AS known_count,
                COALESCE((
                    SELECT COUNT(uwp.id)
                    FROM   topic_word tw2
                    JOIN   user_word_progress uwp
                           ON uwp.topic_word_id = tw2.id
                          AND uwp.user_id       = CAST(:uid AS UUID)
                    WHERE  tw2.topic_id  = t.id
                      AND  tw2.is_active = TRUE
                ), 0)                         AS progress_count,
                EXISTS (
                    SELECT 1
                    FROM   user_session_progress usp
                    WHERE  usp.user_id  = CAST(:uid AS UUID)
                      AND  usp.topic_id = t.id
                      AND  usp.status   = 'in_progress'
                )                             AS has_active_session,
                EXISTS (
                    SELECT 1
                    FROM   user_topic ut
                    WHERE  ut.user_id  = CAST(:uid AS UUID)
                      AND  ut.topic_id = t.id
                )                             AS in_user_topics
            FROM  topic  t
            JOIN  level  l ON t.level_id = l.id
            WHERE l.code      = UPPER(:level_code)
              AND t.is_active = TRUE
            ORDER BY
                t.difficulty ASC,
                t.name
        """),
        {"level_code": level_code, "interests": interests, "uid": user_id or "00000000-0000-0000-0000-000000000000"},
    )
    rows = r.mappings().all()
    return [dict(row) for row in rows]


def _reorder_by_sequence(
    topics: list[dict],
    roadmap_sequence: list,
    append_missing: bool = True,
) -> list[dict]:
    """Reorder topics theo roadmap_sequence; gắn scenario_name/description.

    Args:
        topics:           list topic dict từ get_roadmap_topics.
        roadmap_sequence: list of objects từ user_profile.roadmap_sequence (JSONB).
        append_missing:   True → append topic không có trong sequence vào cuối.
                          False → chỉ trả đúng topic trong sequence (AI-curated mode).
    """
    by_id = {t["id"]: t for t in topics}
    result: list[dict] = []
    seen_ids: set[str] = set()

    for item in roadmap_sequence:
        if isinstance(item, str):
            topic_id = item.strip()
            scenario_name = None
            scenario_description = None
        elif isinstance(item, dict):
            topic_id = str(item.get("topic_id", "")).strip()
            scenario_name = item.get("scenario_name") or None
            scenario_description = item.get("scenario_description") or None
        else:
            continue

        if topic_id in by_id and topic_id not in seen_ids:
            node = dict(by_id[topic_id])
            node["scenario_name"]        = scenario_name
            node["scenario_description"] = scenario_description
            result.append(node)
            seen_ids.add(topic_id)

    if append_missing:
        for t in topics:
            if t["id"] not in seen_ids:
                node = dict(t)
                node["scenario_name"]        = None
                node["scenario_description"] = None
                result.append(node)

    return result


async def get_roadmap(db: AsyncSession, user_id: str) -> dict | None:
    """Hàm tổng hợp: lấy profile + sinh danh sách node roadmap từ mọi level.

    Trả về:
        {
            "level":           str | None,
            "level_name":      str | None,
            "goal_label":      str,          # nhãn tiếng Việt của learning_goal
            "total_topics":    int,
            "selected_topics": int,
            "nodes":           list[dict],
        }
    Trả None nếu user_id không tồn tại trong user_profile.
    """
    profile = await get_profile_for_roadmap(db, user_id)
    if profile is None:
        return None

    target_level = profile.get("target_level")
    learning_goal = profile.get("learning_goal") or ""
    interests: list[str] = list(profile.get("interests") or [])
    roadmap_sequence = profile.get("roadmap_sequence")

    goal_label = _GOAL_LABELS.get(learning_goal, learning_goal or "Lộ trình học")

    # Chưa onboarding — trả empty roadmap (AC-04-04)
    if not target_level:
        return {
            "level":           None,
            "level_name":      None,
            "goal_label":      goal_label,
            "total_topics":    0,
            "selected_topics": 0,
            "nodes":           [],
        }

    # Lấy topic theo level — roadmap vẫn gắn với trình độ người học
    topics = await get_roadmap_topics(db, target_level, interests, user_id)

    if roadmap_sequence and isinstance(roadmap_sequence, list) and len(roadmap_sequence) > 0:
        ordered_topics = _reorder_by_sequence(topics, roadmap_sequence)
    else:
        ordered_topics = [
            {**t, "scenario_name": None, "scenario_description": None}
            for t in topics
        ]

    nodes: list[dict] = []
    for idx, t in enumerate(ordered_topics):
        total_words = int(t["word_count"])
        nodes.append({
            "id":                   t["id"],
            "name":                 t["name"],
            "slug":                 t["slug"],
            "description":          t.get("description"),
            "order_index":          idx,
            "difficulty":           int(t["difficulty"]),
            "is_interest":          bool(t["is_interest"]),
            "status":               _compute_topic_status(
                total_words,
                int(t["known_count"]),
                int(t["progress_count"]),
                bool(t["has_active_session"]),
                bool(t["in_user_topics"]),
            ),
            "word_count":           total_words,
            "scenario_name":        t.get("scenario_name"),
            "scenario_description": t.get("scenario_description"),
        })

    level_name = topics[0]["level_name"] if topics else _default_level_name(target_level)
    selected = sum(1 for n in nodes if n["is_interest"])

    return {
        "level":           target_level,
        "level_name":      level_name,
        "goal_label":      goal_label,
        "total_topics":    len(nodes),
        "selected_topics": selected,
        "nodes":           nodes,
    }


# ─── Helper: nhãn tiếng Việt theo learning_goal ────────────────────────────
_GOAL_LABELS: dict[str, str] = {
    "travel":        "Du lịch",
    "work":          "Công việc",
    "communication": "Giao tiếp hàng ngày",
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
