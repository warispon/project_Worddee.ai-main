from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import date, datetime, timedelta


from app.database import get_db
from app.models import PracticeHistory

router = APIRouter()


@router.get("/summary")
def get_summary(client_date: str | None = None, db: Session = Depends(get_db)):
    total_attempts = db.query(func.count(PracticeHistory.id)).scalar() or 0

    avg_score = db.query(func.avg(PracticeHistory.score)).scalar()
    average_score = float(avg_score) if avg_score is not None else 0.0

    # Use client machine date if provided (YYYY-MM-DD), fallback to server date.
    today = date.today()
    if client_date:
        try:
            today = datetime.fromisoformat(client_date).date()
        except Exception:
            pass

    # Day streak based on distinct practiced dates
    practiced_dates = [row[0] for row in db.query(func.date(PracticeHistory.practiced_at)).distinct().all()]
    # func.date may return strings in SQLite; normalize to date objects
    norm_dates = set()
    for d in practiced_dates:
        if d is None:
            continue
        if isinstance(d, str):
            try:
                norm_dates.add(datetime.fromisoformat(d).date())
            except Exception:
                continue
        else:
            # already a date/datetime
            try:
                norm_dates.add(d if isinstance(d, date) else d.date())
            except Exception:
                continue

    last_active_date = max(norm_dates) if norm_dates else None
    day_streak = 0
    if last_active_date is not None:
        if (today - last_active_date).days <= 1:
            cur = last_active_date
            while cur in norm_dates:
                day_streak += 1
                cur = cur - timedelta(days=1)


    total_words_practiced = (
        db.query(func.count(distinct(PracticeHistory.word_id))).scalar() or 0
    )

    total_minutes_learned = (
        db.query(func.coalesce(func.sum(PracticeHistory.minutes_learned), 0)).scalar()
        or 0
    )

    return {
        "total_attempts": int(total_attempts),
        "average_score": float(average_score),
        "total_words_practiced": int(total_words_practiced),
        "total_minutes_learned": int(total_minutes_learned),
        "day_streak": int(day_streak),
        "last_active_date": last_active_date.isoformat() if last_active_date else None,  
    }