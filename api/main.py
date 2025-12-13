from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.routers import words, practice, stats

app = FastAPI(title="Worddee API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        try:
            cnt = conn.execute(text("SELECT COUNT(*) FROM words")).scalar() or 0
            if cnt == 0:
                conn.execute(
                    text("""
                    INSERT INTO words (word, definition, difficulty_level)
                    VALUES
                      (:w1, :d1, :l1),
                      (:w2, :d2, :l2),
                      (:w3, :d3, :l3),
                      (:w4, :d4, :l4)
                    """),
                    {
                        "w1": "runway",
                        "d1": "a strip of ground for aircraft to take off and land",
                        "l1": "Intermediate",
                        "w2": "confident",
                        "d2": "feeling sure about your abilities or qualities",
                        "l2": "Beginner",
                        "w3": "dedicate",
                        "d3": "to give time, effort, or energy to a task or purpose",
                        "l3": "Intermediate",
                        "w4": "sustainable",
                        "d4": "able to be maintained without harming the environment",
                        "l4": "Advanced",
                    },
                )
        except Exception:
            pass

app.include_router(words.router, prefix="/api", tags=["Words"])
app.include_router(practice.router, prefix="/api", tags=["Practice"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])

@app.get("/")
def read_root():
    return {"status": "ok"}
