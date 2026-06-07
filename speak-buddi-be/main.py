import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import ALLOWED_ORIGINS
from jobs.crawler_scheduler import start_crawler_scheduler, stop_crawler_scheduler
from routers import admin_analytics, admin_content, admin_crawler, admin_payment_plan, ai, auth, learning, onboarding, payment, profile, pronunciation, quiz, roadmap, session, support, translate, user_analytics, voice

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_crawler_scheduler()
    yield
    stop_crawler_scheduler()


app = FastAPI(title="SpeakBuddi API", version="1.0.0", lifespan=lifespan)

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
app.include_router(quiz.router)
app.include_router(onboarding.router)
app.include_router(profile.router)
app.include_router(user_analytics.router)
app.include_router(support.router)
app.include_router(roadmap.router)
app.include_router(session.router)
app.include_router(pronunciation.router)
app.include_router(translate.router)
app.include_router(payment.router)
app.include_router(voice.router)
app.include_router(admin_analytics.router)
app.include_router(admin_content.router)
app.include_router(admin_crawler.router)
app.include_router(admin_payment_plan.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "speakbuddi-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
