
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Word = {
  id: number;
  word: string;
  definition: string;
  difficulty_level: string;
};

type ValidateResult = {
  score: number;
  level: string;
  suggestion: string;
  corrected_sentence: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const toISOWithOffset = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const tz = -d.getTimezoneOffset(); // minutes ahead of UTC
  const sign = tz >= 0 ? "+" : "-";
  const hh = pad(Math.floor(Math.abs(tz) / 60));
  const mm = pad(Math.abs(tz) % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${hh}:${mm}`;
};

const localDateYYYYMMDD = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};


export default function WordOfTheDayPage() {
  const router = useRouter();

  // --- real timer (seconds since page ready) ---
  const startMsRef = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startedAtISO, setStartedAtISO] = useState<string | null>(null);


  const startNewAttempt = () => {
    startMsRef.current = performance.now();
    setStartedAtISO(new Date().toISOString());
    setElapsedSec(0);
  };


  const [word, setWord] = useState<Word | null>(null);
  const [sentence, setSentence] = useState("");
  const [loadingWord, setLoadingWord] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<ValidateResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    // start timer immediately (will reset again when a new word loads)
    startNewAttempt();

    const fetchWord = async () => {
      try {
        setError(null);
        setLoadingWord(true);
        const res = await fetch(`${API_BASE}/api/word`);
        if (!res.ok) throw new Error("Cannot load word of the day");
        const data = (await res.json()) as Word;
        setWord(data);
      
        startNewAttempt();
} catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลด Word of the Day ได้");
      } finally {
        setLoadingWord(false);
      }
    };

    fetchWord();
  }, []);

  const handleRetry = () => {
    setSentence("");
    setResult(null);
    setShowModal(false);
    setError(null);
    startNewAttempt();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !sentence.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/validate-sentence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word_id: word.id,
          sentence: sentence.trim(),
          duration_seconds: startMsRef.current ? Math.max(0, Math.floor((performance.now() - startMsRef.current) / 1000)) : 0,
          client_time_iso: toISOWithOffset(new Date()),
        }),
      });

      if (!res.ok) {
        throw new Error("Validation failed");
      }

      const data = (await res.json()) as ValidateResult;
      setResult(data);
      setShowResultModal(true);
    } catch (err) {
      console.error(err);
      setError("ส่งประโยคไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const isSkeleton = loadingWord || submitting;


  useEffect(() => {
    const id = window.setInterval(() => {
      if (startMsRef.current === null) return;
      setElapsedSec(Math.floor((performance.now() - startMsRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "40px 0",
      
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          background: "#7f9090",
          borderRadius: 16,
          padding: 40,
        }}
      >
        <div
          style={{
            maxWidth: 780,
            margin: "0 auto",
            background: "#fdfdf8",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 18px 40px rgba(15,23,42,0.20)",
          }}
        >
          <h1
            style={{
              margin: 0,
              marginBottom: 4,
              fontSize: "1.8rem",
              color: "#0f172a",
            }}
          >
            Word of the day
          </h1>
          <p
            style={{
              margin: 0,
              marginBottom: 24,
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Practice writing a meaningful sentence using today&apos;s word.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
            <span style={{ background: "#0ea5e9", color: "white", padding: "6px 10px", borderRadius: 999, fontSize: "0.9rem", fontWeight: 700 }}>
              ⏱️ {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, "0")}
            </span>
            <span style={{ background: "#f1f5f9", color: "#0f172a", padding: "6px 10px", borderRadius: 999, fontSize: "0.85rem" }}>
              Started: {startedAtISO ? new Date(startedAtISO).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: 16,
              alignItems: "stretch",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 140,
                borderRadius: 12,
                overflow: "hidden",
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=600&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: "16px 20px 14px",
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {isSkeleton && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      width: 120,
                      height: 20,
                      borderRadius: 999,
                      background: "#f3f4f6",
                    }}
                  />
                  <div
                    style={{
                      width: 220,
                      height: 32,
                      borderRadius: 999,
                      background: "#f3f4f6",
                    }}
                  />
                  <div
                    style={{
                      width: "100%",
                      height: 10,
                      borderRadius: 999,
                      background: "#f3f4f6",
                    }}
                  />
                  <div
                    style={{
                      width: "80%",
                      height: 10,
                      borderRadius: 999,
                      background: "#f3f4f6",
                    }}
                  />
                  <div
                    style={{
                      width: "60%",
                      height: 10,
                      borderRadius: 999,
                      background: "#f3f4f6",
                    }}
                  />
                </div>
              )}

              {!isSkeleton && word && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                      }}
                    >
                      Noun
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: "#fef3c7",
                        fontSize: "0.75rem",
                        color: "#92400e",
                      }}
                    >
                      Level {word.difficulty_level}
                    </span>
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.4rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: "999px",
                        border: "1px solid #e5e7eb",
                        fontSize: "0.8rem",
                      }}
                    >
                      ►
                    </span>
                    {word.word}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "#6b7280",
                    }}
                  >
                    Meaning:{" "}
                    <span style={{ color: "#374151" }}>{word.definition}</span>
                  </p>
                </>
              )}

              {!isSkeleton && !word && !error && (
                <p style={{ fontSize: "0.9rem" }}>No word available today.</p>
              )}

              {error && (
                <p style={{ fontSize: "0.8rem", color: "#b91c1c", marginTop: 4 }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="The plane runway is under construction."
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              disabled={isSkeleton}
              style={{
                width: "100%",
                minHeight: 60,
                resize: "vertical",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: "10px 12px",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />

            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                disabled={isSkeleton}
                onClick={() => router.push("/")}
                style={{
                  padding: "10px 22px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  fontSize: "0.9rem",
                  cursor: isSkeleton ? "default" : "pointer",
                }}
              >
                Do it later
              </button>

              <button
                type="submit"
                disabled={isSkeleton || !sentence.trim()}
                style={{
                  padding: "10px 26px",
                  borderRadius: 999,
                  border: "none",
                  background: "#064e3b",
                  color: "white",
                  fontSize: "0.95rem",
                  cursor:
                    isSkeleton || !sentence.trim() ? "not-allowed" : "pointer",
                  opacity: isSkeleton || !sentence.trim() ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showResultModal && result && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: 760,
              width: "100%",
              background: "white",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 24px 60px rgba(15,23,42,0.55)",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 10,
                fontSize: "1.6rem",
                textAlign: "center",
              }}
            >
              Challenge completed
            </h2>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  padding: "4px 14px",
                  borderRadius: 999,
                  background: "#fef3c7",
                  fontSize: "0.8rem",
                }}
              >
                Level {result.level}
              </span>
              <span
                style={{
                  padding: "4px 14px",
                  borderRadius: 999,
                  background: "#e5e7eb",
                  fontSize: "0.8rem",
                }}
              >
                Score {result.score.toFixed(1)}
              </span>
            </div>

            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                fontSize: "0.9rem",
              }}
            >
              <strong>Your sentence: </strong>
              {sentence}
            </div>

            <div
              style={{
                marginBottom: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: "#ecfdf3",
                border: "1px solid #bbf7d0",
                fontSize: "0.9rem",
              }}
            >
              <strong>Suggestion: </strong>
              {result.corrected_sentence || result.suggestion}
            </div>

            <p
              style={{
                fontSize: "0.8rem",
                color: "#6b7280",
                marginTop: 0,
                marginBottom: 24,
              }}
            >
              {result.suggestion}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 999,
                  border: "1px solid #d4d4d8",
                  background: "white",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: "10px 24px",
                  borderRadius: 999,
                  border: "none",
                  background: "#064e3b",
                  color: "white",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                View my progress
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
