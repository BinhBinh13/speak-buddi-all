from pydantic import BaseModel


class TopicData(BaseModel):
    label:         str
    words:         list[str] | None = None
    grammarTopics: list[str] | None = None


class HistoryMessage(BaseModel):
    role:    str  # "user" | "assistant"
    content: str


class SpeakRequest(BaseModel):
    text:    str
    context: str | None           = None
    topic:   TopicData | None     = None
    history: list[HistoryMessage] = []


class TTSRequest(BaseModel):
    text: str
