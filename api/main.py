from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.include_router(words.router, prefix="/api", tags=["Words"])
app.include_router(practice.router, prefix="/api", tags=["Practice"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])

@app.get("/")
def read_root():
    return {"status": "ok"}
