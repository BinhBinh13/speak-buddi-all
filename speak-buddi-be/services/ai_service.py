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
        all_words = (
            ", ".join(wd.word for wd in topic.word_details[:8])
            if topic and topic.word_details
            else ", ".join(topic.words[:8]) if topic and topic.words
            else ""
        )
        label = topic.label if topic else "bài học này"
        return f"""You are SpeakBuddi AI — a friendly English speaking coach.

Your task: Open the lesson "{label}" with a SHORT, meaningful scenario (not a word list).

The opening should:
1. Welcome the user and name the lesson (1 sentence).
2. Set a simple real-life scene for this topic (e.g. meeting someone, counting items, daily chat).
3. Naturally weave in 3–5 vocabulary words from this batch: {all_words if all_words else "the target words"}.
4. End with ONE engaging question that fits the scene and invites the user to respond.

Rules: English only, NO markdown, max 4 sentences, warm conversational tone — like a tutor starting a role-play."""

    if topic:
        word_list = _build_word_list(topic)
        grammar   = ", ".join(topic.grammarTopics) if topic.grammarTopics else ""
        return f"""You are SpeakBuddi AI — a friendly English speaking coach.

LESSON: "{topic.label}"
TARGET VOCABULARY FOR THIS SESSION (use ALL across the conversation):
{word_list}
{f"GRAMMAR TO PRACTICE: {grammar}" if grammar else ""}

TEACHING METHOD — SCENARIO-BASED (NOT word-by-word drills):
- Maintain ONE coherent mini-scenario related to "{topic.label}" for the whole session.
- Weave multiple target words into each reply naturally (aim for 2–4 words per turn when possible).
- Do NOT isolate one word per turn or ask robotic prompts like "Say the word X".
- Each reply: advance the story/situation, model natural English, then ask ONE meaningful question.
- Encourage the user to answer in full sentences using vocabulary from the list.
- If the user has not used certain words yet, guide them through the scenario toward those words.
- When the user makes a grammar mistake, correct gently once, then continue the scene.

RULES:
- Reply in English only, 3–4 sentences max (voice conversation).
- No markdown, no bullet points, plain prose only.
- Keep the dialogue purposeful and realistic — the user should feel they are practicing real conversation."""

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
        max_tokens=280,
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
            max_output_tokens=280,
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
