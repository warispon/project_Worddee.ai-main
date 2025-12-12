import os
import random
from typing import Any, Dict

import requests


def mock_ai_validation(sentence: str, target_word: str, difficulty: str) -> dict:
    """Mock AI validation - simulates scoring and feedback."""
    sentence_lower = sentence.lower()
    target_word_lower = target_word.lower()

    has_word = target_word_lower in sentence_lower
    words = sentence.split()
    word_count = len(words)

    if not has_word:
        return {
            "score": 0.0,
            "level": difficulty,
            "suggestion": f"Your sentence must include the word '{target_word}'. Please try again.",
            "corrected_sentence": f"Remember to use '{target_word}' in your sentence.",
        }

    if word_count < 5:
        score = random.uniform(4.0, 6.0)
        suggestion = "Try to make your sentence longer and more descriptive."
    elif word_count < 10:
        score = random.uniform(6.5, 8.5)
        suggestion = "Good sentence! Consider adding more details or complex structures."
    else:
        score = random.uniform(8.0, 10.0)
        suggestion = "Excellent! Your sentence is well-structured and descriptive."

    if difficulty == "Advanced" and word_count > 8:
        score = min(10.0, score + 0.5)

    return {
        "score": round(score, 1),
        "level": difficulty,
        "suggestion": suggestion,
        "corrected_sentence": sentence,
    }


def call_n8n_validation(sentence: str, target_word: str, difficulty: str) -> Dict[str, Any]:
    """Call n8n webhook for AI validation, fallback to mock if anything fails."""
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if not webhook_url:
        return mock_ai_validation(sentence, target_word, difficulty)

    payload = {
        "sentence": sentence,
        "word": target_word,
        "difficulty": difficulty,
    }
    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if not all(k in data for k in ("score", "level", "suggestion", "corrected_sentence")):
            return mock_ai_validation(sentence, target_word, difficulty)
        return data
    except Exception:
        return mock_ai_validation(sentence, target_word, difficulty)
