from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import re
from datetime import datetime
from zoneinfo import ZoneInfo
from math import ceil

from app.database import get_db
from app.models import Word, PracticeHistory

router = APIRouter()


class ValidateSentenceRequest(BaseModel):
    word_id: int
    sentence: str
    duration_seconds: int | None = None
    minutes_learned: int | None = None


    client_time_iso: str | None = None  # client machine time ISO8601 (prefer incl. UTC offset)
@router.post("/validate-sentence")
def validate_sentence(payload: ValidateSentenceRequest, db: Session = Depends(get_db)):
 
    word = db.query(Word).filter(Word.id == payload.word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    user_sentence = payload.sentence.strip()
    if not user_sentence:
        raise HTTPException(status_code=400, detail="Sentence is required")

        # minutes_learned: prefer real timer from frontend (duration_seconds)
    minutes_learned = 0
    if payload.duration_seconds is not None:
        # round up to at least 1 minute when user submits
        sec = max(0, int(payload.duration_seconds))
        minutes_learned = 1 if sec > 0 else 0
        if sec > 60:
            minutes_learned = (sec + 59) // 60
    elif payload.minutes_learned is not None:
        minutes_learned = int(payload.minutes_learned)


    if minutes_learned < 0:
        minutes_learned = 0
    if minutes_learned > 600:  
        minutes_learned = 600

        # Normalize duration
    duration_seconds = 0
    if payload.duration_seconds is not None:
        duration_seconds = max(0, int(payload.duration_seconds))

    # Timestamp for practice submission
    # Prefer client machine time if provided (so changing the computer date/time affects streak),
    # fallback to server time (Asia/Bangkok).
    now_bkk = None
    if payload.client_time_iso:
        try:
            dt = datetime.fromisoformat(payload.client_time_iso)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=ZoneInfo("Asia/Bangkok"))
            now_bkk = dt.astimezone(ZoneInfo("Asia/Bangkok"))
        except Exception:
            now_bkk = None

    if now_bkk is None:
        now_bkk = datetime.now(ZoneInfo("Asia/Bangkok"))
    # ---- Simple scoring logic (no external AI required) ----
    target = (word.word or "").strip()
    s = user_sentence

    def normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    s = normalize(s)

    # Basic heuristics
    words = re.findall(r"[A-Za-z']+", s)
    word_count = len(words)

    # Check if target word appears as a whole word (case-insensitive)
    has_target = bool(re.search(rf"\b{re.escape(target)}\b", s, flags=re.IGNORECASE))

    # Very rough "non-gibberish" check: count words that contain a vowel
    vowel_words = sum(1 for w in words if re.search(r"[aeiou]", w, flags=re.IGNORECASE))
    looks_like_language = vowel_words >= max(2, min(4, word_count))

    # Start scoring
    score = 0.0
    if has_target:
        score += 4.0
    else:
        score += 0.5

    if word_count >= 6:
        score += 2.0
    if word_count >= 10:
        score += 2.0

    if re.match(r"^[A-Z]", s):
        score += 0.5
    if re.search(r"[.!?]$", s):
        score += 0.5

    if looks_like_language:
        score += 1.0
    else:
        score -= 2.0

    # Clamp to 0..10
    score = max(0.0, min(10.0, round(score, 1)))

    level = word.difficulty_level

    # Suggestions
    suggestion_parts = []
    if not has_target:
        suggestion_parts.append(f'Use the word "{target}" in your sentence.')
    if word_count < 6:
        suggestion_parts.append("Try adding more detail (at least 6 words).")
    if not re.search(r"[.!?]$", s):
        suggestion_parts.append("End the sentence with punctuation (., !, or ?).")
    if not looks_like_language:
        suggestion_parts.append("Use clear, meaningful English words (avoid random letters).")

    suggestion = " ".join(suggestion_parts) if suggestion_parts else "Nice! Your sentence looks good."

    # "Corrected" sentence = simple cleanup (capital + punctuation)
    corrected_sentence = s
    if corrected_sentence and not re.match(r"^[A-Z]", corrected_sentence):
        corrected_sentence = corrected_sentence[0].upper() + corrected_sentence[1:]
    if corrected_sentence and not re.search(r"[.!?]$", corrected_sentence):
        corrected_sentence += "."


    history = PracticeHistory(
        word_id=word.id,
        user_sentence=user_sentence,
        score=score,
        feedback=suggestion,
        corrected_sentence=corrected_sentence,
        minutes_learned=minutes_learned,
        duration_seconds=duration_seconds,
        practiced_at=now_bkk,
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "score": score,
        "level": level,
        "suggestion": suggestion,
        "corrected_sentence": corrected_sentence,
        "minutes_learned": minutes_learned, 
        "duration_seconds": duration_seconds, 
    }



@router.get("/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    """Return recent practice attempts (newest first)."""
    q = (
        db.query(PracticeHistory, Word)
        .join(Word, Word.id == PracticeHistory.word_id)
        .order_by(PracticeHistory.practiced_at.desc())
        .limit(min(max(limit, 1), 200))
        .all()
    )

    out = []
    for h, w in q:
        out.append(
            {
                "id": h.id,
                "word": w.word,
                "word_id": h.word_id,
                "user_sentence": h.user_sentence,
                "score": float(h.score),
                "feedback": h.feedback,
                "corrected_sentence": h.corrected_sentence,
                "minutes_learned": int(h.minutes_learned),
                "duration_seconds": int(getattr(h, "duration_seconds", 0) or 0),
                "practiced_at": h.practiced_at.isoformat() if h.practiced_at else None,
            }
        )
    return out
