import logging

from google.genai import types as genai_types

from core.clients import get_claude_client, get_gemini_client
from core.config import AI_PROVIDER, ANTHROPIC_MODEL, GEMINI_MODEL, MAX_HISTORY_TURNS
from schemas.ai import HistoryMessage, TopicData, WordDetail

log = logging.getLogger("speakbuddi.ai")

_PROMPT_BASE = """You are SpeakBuddi AI — a friendly English speaking coach.

Rules:
- Always reply in English only.
- Keep it SHORT: 2-3 sentences max — this is a voice conversation.
- End with a short question to keep the conversation going.
- Natural, friendly tone.
- If the user makes a grammar mistake, gently correct it once.
- NO markdown, bullet points, or special characters — plain prose only."""


def _build_word_list(topic: TopicData) -> str:
    """Tạo danh sách từ có nghĩa + ví dụ để nhúng vào system prompt."""
    if topic.word_details:
        lines = []
        for i, wd in enumerate(topic.word_details, 1):
            line = f"{i}. {wd.word}"
            if wd.meaning_vi:
                line += f" ({wd.meaning_vi})"
            if wd.example:
                line += f' — e.g. "{wd.example}"'
            lines.append(line)
        return "\n".join(lines)
    if topic.words:
        return "\n".join(f"{i}. {w}" for i, w in enumerate(topic.words, 1))
    return ""


def _build_system_prompt(topic: TopicData | None, context: str | None) -> str:
    if context and context.startswith("GREETING_MODE:"):
        first_words = (
            ", ".join(wd.word for wd in topic.word_details[:4])
            if topic and topic.word_details
            else ", ".join(topic.words[:4]) if topic and topic.words
            else ""
        )
        label = topic.label if topic else "bài học này"
        return f"""You are SpeakBuddi AI — a focused English vocabulary coach.

Your task: Generate an OPENING GREETING for the lesson "{label}".

The greeting should:
1. Welcome the user and name the lesson "{label}" (1 sentence).
2. Preview 2-3 key words from the list: {first_words if first_words else "the target vocabulary"}.
3. Ask a simple opening question using one of those words to start practice.

Rules: English only, NO markdown, max 3 sentences, friendly tone."""

    if topic:
        word_list = _build_word_list(topic)
        grammar   = ", ".join(topic.grammarTopics) if topic.grammarTopics else ""
        return f"""You are SpeakBuddi AI — a focused English vocabulary coach.

LESSON: "{topic.label}"
TARGET WORDS (teach in this order):
{word_list}
{f"GRAMMAR TO PRACTICE: {grammar}" if grammar else ""}

TEACHING METHOD:
- Work through the target words IN ORDER, 1-2 words per turn.
- For each word: use it naturally in your reply, then ask a question that requires the user to USE that exact word in their answer.
- Only advance to the next word(s) after the user has responded using the current word.
- If the user avoids the target word, gently prompt: 'Try using the word "[word]" in your answer.'
- Do NOT ask questions unrelated to the current target word(s).

RULES:
- Reply in English only, 2-3 sentences max.
- No markdown, no bullet points, plain prose only.
- Correct grammar mistakes gently, at most once per turn."""

    if context:
        return _PROMPT_BASE + f'\n\nChủ đề tự do người dùng chọn: "{context}". Hãy dẫn dắt hội thoại xung quanh chủ đề này.'

    return _PROMPT_BASE


def _trim_history(history: list[HistoryMessage]) -> list[HistoryMessage]:
    max_msgs = MAX_HISTORY_TURNS * 2
    trimmed  = history[-max_msgs:] if len(history) > max_msgs else history
    if trimmed and trimmed[0].role == "assistant":
        trimmed = trimmed[1:]
    return trimmed


def _reply_anthropic(
    user_text: str,
    system_msg: str,
    trimmed_history: list[HistoryMessage],
) -> str:
    """Gọi Anthropic Claude."""
    client = get_claude_client()
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in trimmed_history
    ] + [{"role": "user", "content": user_text}]

    log.info("PROVIDER=anthropic  model=%s  history=%d", ANTHROPIC_MODEL, len(messages))
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=200,
        system=system_msg,
        messages=messages,
    )
    return response.content[0].text.strip()


def _reply_gemini(
    user_text: str,
    system_msg: str,
    trimmed_history: list[HistoryMessage],
) -> str:
    """Gọi Google Gemini dùng google-genai SDK mới (thay thế google-generativeai deprecated).

    Gemini dùng role "user" / "model" (không phải "assistant").
    """
    client = get_gemini_client()

    # Build contents: history + user message hiện tại
    # Gemini: role = "user" | "model"
    contents: list[genai_types.Content] = [
        genai_types.Content(
            role="model" if msg.role == "assistant" else "user",
            parts=[genai_types.Part(text=msg.content)],
        )
        for msg in trimmed_history
    ]
    contents.append(
        genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=user_text)],
        )
    )

    log.info("PROVIDER=gemini  model=%s  history=%d", GEMINI_MODEL, len(contents))
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=genai_types.GenerateContentConfig(
            system_instruction=system_msg,
            max_output_tokens=200,
        ),
    )
    return response.text.strip()


def get_ai_reply(
    user_text: str,
    context:   str | None,
    topic:     TopicData | None,
    history:   list[HistoryMessage],
) -> str:
    system_msg      = _build_system_prompt(topic, context)
    trimmed_history = _trim_history(history)

    if AI_PROVIDER == "gemini":
        return _reply_gemini(user_text, system_msg, trimmed_history)
    else:
        return _reply_anthropic(user_text, system_msg, trimmed_history)
