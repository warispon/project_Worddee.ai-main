from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), unique=True, nullable=False, index=True)
    definition = Column(String(500), nullable=False)
    difficulty_level = Column(String(50), nullable=False)


class PracticeHistory(Base):
    """
    เก็บประวัติการ submit ประโยค + score + feedback + เวลาที่เรียน (นาที)
    """
    __tablename__ = "practice_history"

    id = Column(Integer, primary_key=True, index=True)

    word_id = Column(Integer, ForeignKey("words.id"), nullable=False, index=True)

    user_sentence = Column(String(1000), nullable=False)

    score = Column(Float, default=0.0, nullable=False)

    feedback = Column(String(2000), default="", nullable=False)

    corrected_sentence = Column(String(2000), default="", nullable=False)

    # ✅ เพิ่ม: เวลาที่ใช้เรียน (นาที)
    minutes_learned = Column(Integer, default=0, nullable=False)

    # ✅ เพิ่ม: เวลาที่ใช้จริง (วินาที)
    duration_seconds = Column(Integer, default=0, nullable=False)

    practiced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)