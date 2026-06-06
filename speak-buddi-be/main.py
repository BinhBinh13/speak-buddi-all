import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import ALLOWED_ORIGINS
<<<<<<< HEAD
from routers import ai, auth, learning, quiz, onboarding, profile, roadmap

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")

app = FastAPI(title="SpeakBuddi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Reply-Text"],
)

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(learning.router)
<<<<<<< HEAD
app.include_router(quiz.router)
app.include_router(onboarding.router)
app.include_router(profile.router)
app.include_router(roadmap.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "speakbuddi-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
