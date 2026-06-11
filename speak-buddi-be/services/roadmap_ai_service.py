# speak-buddi-be/services/roadmap_ai_service.py
# ─── AI service: sinh roadmap_sequence cá nhân hóa (S2.1 v2 — scenario-based) ──
#
# Hàm chính: generate_roadmap_sequence(level, goal, topics) -> list[dict]
#   - Gọi Claude để reorder topic list thành lộ trình học theo tình huống thực tế.
#   - Mỗi node: {topic_id, scenario_name, scenario_description} (tiếng Việt).
#   - Anti-hallucination: validate topic_id ∈ tập đã fetch; append topic bỏ sót.
#   - Degrade: exception → return [], log warning (caller tiếp tục không raise).
#   - Không log scenario text / nội dung cá nhân (SRS §4.5).
# ─────────────────────────────────────────────────────────────────────────────

import json
import logging
import re

from core.clients import get_claude_client
from core.config import ANTHROPIC_MODEL

log = logging.getLogger("speakbuddi.roadmap_ai")

# Map từ goal slug → mô tả tiếng Anh cho prompt
_GOAL_DESC: dict[str, str] = {
    "travel":        "travel and tourism",
    "work":          "work and professional/business contexts",
    "communication": "everyday daily communication",
}

_SYSTEM_PROMPT = """You are a curriculum designer for a Vietnamese English-learning app.
The app's USP is: "Learn English and speak it immediately in real life."
Your task: given a learner's CEFR level and learning goal, reorder the available topics
into a scenario-based learning path — each topic becomes a real-life communication scenario.

Rules:
- Use ONLY the topic_ids provided. Do NOT invent ids.
- Include every topic_id exactly once.
- For each topic, assign a Vietnamese scenario_name (a real-life situation, e.g. "Đặt phòng khách sạn") — NOT the raw topic category name.
- Write a short Vietnamese scenario_description (1 sentence): what the learner will be able to DO after completing this node.
- Order: most immediately useful/relevant to the goal first; foundational language first within same relevance.
- Reply with a raw JSON array ONLY. No prose, no markdown fences."""


def _build_user_message(level: str, goal: str, topics: list[dict]) -> str:
    """Xây dựng user message cho Claude từ level, goal slug, và danh sách topic."""
    goal_desc = _GOAL_DESC.get(goal, goal)
    topic_lines = "\n".join(
        f'- topic_id={t["id"]} name="{t["name"]}"' for t in topics
    )
    return (
        f"CEFR level: {level}\n"
        f"Learning goal: {goal_desc}\n"
        f"Topics:\n{topic_lines}\n\n"
        f'Return ordered JSON array:\n'
        f'[{{"topic_id":"...","scenario_name":"...","scenario_description":"..."}},...]'
    )


def _strip_code_fence(text: str) -> str:
    """Loại bỏ ```json...``` hoặc ```...``` nếu Claude bọc output."""
    text = text.strip()
    # Loại bỏ code fence đầu và cuối
    text = re.sub(r"^```[a-z]*\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _validate_and_complete(
    raw: list, valid_ids: set[str], topics_ordered: list[dict]
) -> list[dict]:
    """Anti-hallucination: lọc object có topic_id hợp lệ + bổ sung topic bỏ sót.

    Args:
        raw:            list thô từ json.loads (element có thể là dict hoặc string).
        valid_ids:      tập topic_id hợp lệ từ DB.
        topics_ordered: list topic theo thứ tự gốc (để append topic bỏ sót cuối).

    Returns:
        list[dict] — mỗi element: {topic_id, scenario_name, scenario_description}.
        Luôn phủ đủ tất cả valid_ids (topic thiếu có scenario=None).
    """
    result: list[dict] = []
    seen_ids: set[str] = set()

    for item in raw:
        # Backward-compat: element dạng string (format cũ)
        if isinstance(item, str):
            topic_id = item.strip()
            if topic_id in valid_ids and topic_id not in seen_ids:
                result.append({
                    "topic_id":             topic_id,
                    "scenario_name":        None,
                    "scenario_description": None,
                })
                seen_ids.add(topic_id)
        elif isinstance(item, dict):
            topic_id = str(item.get("topic_id", "")).strip()
            if topic_id in valid_ids and topic_id not in seen_ids:
                result.append({
                    "topic_id":             topic_id,
                    "scenario_name":        item.get("scenario_name") or None,
                    "scenario_description": item.get("scenario_description") or None,
                })
                seen_ids.add(topic_id)
        # element loại khác / topic_id không hợp lệ → bỏ qua

    # Append topic bỏ sót theo thứ tự gốc (difficulty/order từ DB)
    for t in topics_ordered:
        if t["id"] not in seen_ids:
            result.append({
                "topic_id":             t["id"],
                "scenario_name":        None,
                "scenario_description": None,
            })

    return result


def generate_roadmap_sequence(
    level: str,
    goal: str,
    topics: list[dict],
) -> list[dict]:
    """Gọi Claude để sinh roadmap_sequence cá nhân hóa theo scenario.

    Args:
        level:  CEFR level code (ví dụ "A1").
        goal:   slug mục tiêu: "travel" | "work" | "communication".
        topics: list {id, name, slug} từ get_topics_by_level.

    Returns:
        list[dict] — mỗi element: {topic_id, scenario_name, scenario_description}.
        Trả [] nếu topics rỗng hoặc gặp exception (caller degrade an toàn).
        Luôn phủ đủ tất cả topic_id (topic bỏ sót → append cuối với scenario=None).
    """
    if not topics:
        return []

    # Nếu chỉ có 1 topic — không cần gọi AI, trả luôn
    if len(topics) == 1:
        return [{
            "topic_id":             topics[0]["id"],
            "scenario_name":        None,
            "scenario_description": None,
        }]

    valid_ids: set[str] = {t["id"] for t in topics}

    try:
        client = get_claude_client()
        user_msg = _build_user_message(level, goal, topics)

        response = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1500,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw_text = response.content[0].text.strip()
        clean_text = _strip_code_fence(raw_text)
        parsed = json.loads(clean_text)

        if not isinstance(parsed, list):
            log.warning("ROADMAP_AI: Claude không trả list, trả %s", type(parsed).__name__)
            return []

        result = _validate_and_complete(parsed, valid_ids, topics)
        log.info("ROADMAP_AI ok level=%s goal=%s topics_in=%d seq_out=%d",
                 level, goal, len(topics), len(result))
        return result

    except json.JSONDecodeError as exc:
        log.warning("ROADMAP_AI: JSON parse fail — %s", exc)
        return []
    except Exception as exc:  # noqa: BLE001
        log.warning("ROADMAP_AI: exception — %s", exc)
        return []
