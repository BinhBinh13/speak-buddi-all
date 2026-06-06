import logging

from core.clients import get_claude_client
from core.config import MAX_HISTORY_TURNS
from schemas.ai import HistoryMessage, TopicData

log = logging.getLogger("speakbuddi.ai")

_PROMPT_BASE = """You are SpeakBuddi AI — a friendly English speaking coach.

Rules:
- Always reply in English only.
- Keep it SHORT: 2-3 sentences max — this is a voice conversation.
- End with a short question to keep the conversation going.
- Natural, friendly tone.
- If the user makes a grammar mistake, gently correct it once.
- NO markdown, bullet points, or special characters — plain prose only."""


def _build_system_prompt(topic: TopicData | None, context: str | None) -> str:
    if context and context.startswith("GREETING_MODE:"):
        vocab = ", ".join(topic.words[:6]) if topic and topic.words else ""
        label = topic.label if topic else "bài học này"
        return f"""You are SpeakBuddi AI — a friendly English speaking coach.

Your task: Generate an OPENING GREETING for the lesson "{label}".

The greeting should:
1. Welcome the user and introduce the topic "{label}" (1 sentence).
2. Mention 2-3 key words to practice: {vocab if vocab else "related vocabulary"}.
3. Ask an opening question to start the conversation (1 sentence).

Rules: English only, NO markdown, max 4 sentences, natural tone."""

    if topic:
        vocab   = ", ".join(topic.words[:8])     if topic.words         else ""
        grammar = ", ".join(topic.grammarTopics) if topic.grammarTopics else ""
        extra   = f"""

Bài học đang luyện: "{topic.label}"
{f"Từ vựng cần dùng trong hội thoại: {vocab}" if vocab else ""}
{f"Ngữ pháp cần luyện tập: {grammar}" if grammar else ""}

Nhiệm vụ: tự nhiên lồng ghép các từ vựng và cấu trúc ngữ pháp trên vào câu hỏi để người học thực hành."""
        return _PROMPT_BASE + extra

    if context:
        return _PROMPT_BASE + f'\n\nChủ đề tự do người dùng chọn: "{context}". Hãy dẫn dắt hội thoại xung quanh chủ đề này.'

    return _PROMPT_BASE


def _trim_history(history: list[HistoryMessage]) -> list[HistoryMessage]:
    max_msgs = MAX_HISTORY_TURNS * 2
    trimmed  = history[-max_msgs:] if len(history) > max_msgs else history
    if trimmed and trimmed[0].role == "assistant":
        trimmed = trimmed[1:]
    return trimmed


def get_ai_reply(
    user_text: str,
    context:   str | None,
    topic:     TopicData | None,
    history:   list[HistoryMessage],
) -> str:
    client          = get_claude_client()
    system_msg      = _build_system_prompt(topic, context)
    trimmed_history = _trim_history(history)
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in trimmed_history
    ] + [{"role": "user", "content": user_text}]

    log.info("HISTORY  %d messages sent to Claude", len(messages))
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=system_msg,
        messages=messages,
    )
    return message.content[0].text.strip()
