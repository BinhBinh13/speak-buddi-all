from pydantic import BaseModel


class WordDetail(BaseModel):
    word:       str
    meaning_vi: str | None = None
    example:    str | None = None


class TopicData(BaseModel):
    label:        str
    words:        list[str]        | None = None
    word_details: list[WordDetail] | None = None
    grammarTopics: list[str]       | None = None


class HistoryMessage(BaseModel):
    role:    str  # "user" | "assistant"
    content: str


class SpeakRequest(BaseModel):
    text:            str
    context:         str | None           = None
    topic:           TopicData | None     = None
    history:         list[HistoryMessage] = []
    elapsed_seconds: int                  = 0   # S7.2: thời gian turn hiện tại (giây); 0 → fallback 30s


class TTSRequest(BaseModel):
    text: str


class SpeakTextFallbackOut(BaseModel):
    """Response khi Claude OK nhưng ElevenLabs TTS lỗi.

    FE nhận dạng qua Content-Type: application/json + tts_error=true.
    Trả 200 (không 502) để giữ được text reply (AC-09-04: không mất dữ liệu).
    """
    reply_text: str
    audio:      None = None
    tts_error:  bool = True
