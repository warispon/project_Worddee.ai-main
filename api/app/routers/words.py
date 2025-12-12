from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random

from app.database import get_db
from app.models import Word
from app.schemas import WordResponse

router = APIRouter()


@router.get("/word", response_model=WordResponse)
def get_random_word(db: Session = Depends(get_db)):
    """Return a random word for the Word of the Day challenge."""
    words = db.query(Word).all()
    if not words:
        raise HTTPException(status_code=404, detail="No words available")
    word = random.choice(words)
    return word
