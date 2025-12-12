from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.database import Base, engine, SessionLocal
from app.routers import words, practice, stats
from app.models import Word
 
# Create tables
Base.metadata.create_all(bind=engine)


from sqlalchemy import text

def ensure_practice_history_schema():
    # SQLite: add new columns safely if they don't exist yet
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(practice_history);")).fetchall()]
        if "duration_seconds" not in cols:
            conn.execute(text("ALTER TABLE practice_history ADD COLUMN duration_seconds INTEGER DEFAULT 0;"))
        # practiced_at already exists in this project; keep as-is
        conn.commit()


ensure_practice_history_schema()
 
 
def seed_words():
    db = SessionLocal()
    try:
        if db.query(Word).count() == 0:
            samples = [
    Word(
        word="runway",
        definition="A paved strip at an airport on which planes take off and land.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="meticulous",
        definition="Showing great attention to detail; very careful and precise.",
        difficulty_level="Advanced",
    ),
    Word(
        word="cozy",
        definition="Giving a feeling of comfort, warmth, and relaxation.",
        difficulty_level="Beginner",
    ),
    Word(
        word="ambitious",
        definition="Having a strong desire to succeed or achieve something.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="resilient",
        definition="Able to recover quickly from difficulties.",
        difficulty_level="Advanced",
    ),
    Word(
        word="curious",
        definition="Eager to know or learn something.",
        difficulty_level="Beginner",
    ),
    Word(
        word="optimistic",
        definition="Hopeful and confident about the future.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="innovative",
        definition="Featuring new methods; advanced and original.",
        difficulty_level="Advanced",
    ),
    Word(
        word="confident",
        definition="Feeling or showing certainty about something.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="grateful",
        definition="Feeling or showing appreciation for something.",
        difficulty_level="Beginner",
    ),
    Word(
        word="diligent",
        definition="Showing care and effort in one's work or duties.",
        difficulty_level="Advanced",
    ),
    Word(
        word="efficient",
        definition="Achieving maximum productivity with minimal wasted effort.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="reliable",
        definition="Consistently good in quality or performance; trustworthy.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="brilliant",
        definition="Very bright, intelligent, or impressive.",
        difficulty_level="Beginner",
    ),
    Word(
        word="adaptable",
        definition="Able to adjust to new conditions or environments.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="creative",
        definition="Using imagination to produce original ideas.",
        difficulty_level="Beginner",
    ),
    Word(
        word="fundamental",
        definition="Forming a necessary base or core; essential.",
        difficulty_level="Advanced",
    ),
    Word(
        word="serene",
        definition="Calm, peaceful, and untroubled.",
        difficulty_level="Intermediate",
    ),
    Word(
        word="vulnerable",
        definition="Sensitive or open to emotional or physical harm.",
        difficulty_level="Advanced",
    ),
    Word(
        word="generous",
        definition="Showing kindness by giving more than is necessary.",
        difficulty_level="Beginner",
    ),
]
 
            db.add_all(samples)
            db.commit()
    finally:
        db.close()
 
 
seed_words()
 
app = FastAPI(
    title="Worddee.ai API",
    version="1.0.0",
    description="API for Word of the Day, sentence validation, and learning summary.",
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(words.router, prefix="/api", tags=["Words"])
app.include_router(practice.router, prefix="/api", tags=["Practice"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
 
 
@app.get("/")
def read_root():
    return {
        "message": "Worddee.ai API is running",
        "version": "1.0.0",
        "endpoints": {
            "word_of_the_day": "/api/word",
            "validate_sentence": "/api/validate-sentence",
            "summary": "/api/summary",
            "history": "/api/history",
        },
    }
 
 