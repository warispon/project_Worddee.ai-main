"use client";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const localDateYYYYMMDD = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

type Summary = {
  total_attempts: number;
  average_score: number;
  total_words_practiced?: number;
  total_minutes_learned: number;
  day_streak?: number;
  last_active_date?: string | null;
};

type HistoryItem = {
  id: number;
  word?: string;
  user_sentence?: string;
  score: number;
  feedback?: string;
  corrected_sentence?: string;
  practiced_at?: string; 
};

export default function DashboardPage() {
  const router = useRouter();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setError(null);
        setLoading(true);

        const [summaryRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/api/summary?client_date=${encodeURIComponent(localDateYYYYMMDD())}`),
          fetch(`${API_BASE}/api/history`),
        ]);

        if (!summaryRes.ok || !historyRes.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const summaryJson = (await summaryRes.json()) as Summary;
        const historyJson = (await historyRes.json()) as HistoryItem[];

        setSummary(summaryJson);
        setHistory(historyJson);
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูล Dashboard ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

 
  const orderedHistory = useMemo(() => {
    if (!history || history.length === 0) return [];

    const hasTime = history.every((x) => !!x.practiced_at);

    if (hasTime) {
      
      return [...history].sort(
        (a, b) =>
          new Date(a.practiced_at as string).getTime() -
          new Date(b.practiced_at as string).getTime()
      );
    }

    return [...history].reverse();
  }, [history]);

  const chartLabels = orderedHistory.map((_, idx) => `Attempt ${idx + 1}`);
  const chartScores = orderedHistory.map((item) => item.score);

  const lineData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Score",
        data: chartScores,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };

  
  const totalSecondsLearned = useMemo(() => {
    if (!history || history.length === 0) return 0;
    return history.reduce((sum, item: any) => {
      const sec = typeof item?.duration_seconds === "number" ? item.duration_seconds : 0;
      return sum + Math.max(0, sec);
    }, 0);
  }, [history]);

  const hours = Math.floor(totalSecondsLearned / 3600);
  const minutes = Math.floor((totalSecondsLearned % 3600) / 60);

  return (
    <main
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "40px 0",
        background: "#7f9090", 
      }}
    >
      
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 16px" }}>
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            background: "white",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 18px 40px rgba(15,23,42,0.20)",
          }}
        >
          
          <header style={{ marginBottom: 22 }}>
            <h1
              style={{
                margin: 0,
                marginBottom: 4,
                fontSize: "1.7rem",
                color: "#0f172a",
              }}
            >
               learner dashboard
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              Your missions today
            </p>
          </header>

          
          <section
            style={{
              marginBottom: 24,
              borderRadius: 12,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              padding: "12px 16px",
              fontSize: "0.9rem",
            }}
          >
            <span role="img" aria-label="check">
              ✅
            </span>{" "}
            Well done! You&apos;ve completed all your missions.
          </section>

          
          <section>
            <h2
              style={{
                margin: 0,
                marginBottom: 14,
                fontSize: "1.1rem",
              }}
            >
              Overview
            </h2>

            {error && (
              <p style={{ fontSize: "0.85rem", color: "#b91c1c" }}>{error}</p>
            )}

            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                gap: 14,
                marginBottom: 22,
              }}
            >
              
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                  background: "#f9fafb",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  Learning consistency
                </p>
                <p style={{ margin: 0, fontSize: "1.2rem" }}>
                  {summary ? (summary.day_streak ?? 0) : "-"}
                </p>
                <p
                  style={{
                    margin: 0,
                    marginTop: 2,
                    fontSize: "0.75rem",
                    color: "#6b7280",
                  }}
                >
                  Day streak (based on your device date)
                </p>
              </div>

              
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                  background: "#f9fafb",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  Average score
                </p>
                <p style={{ margin: 0, fontSize: "1.2rem" }}>
                  {summary ? summary.average_score.toFixed(1) : "-"}
                </p>
              </div>

              
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                  background: "#f9fafb",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  Hours / Minutes learned
                </p>

                <p style={{ margin: 0, fontSize: "1.2rem" }}>
                  {summary ? `${hours > 0 ? `${hours}h ` : ""}${minutes}m` : "-"}
                </p>

                <p
                  style={{
                    margin: 0,
                    marginTop: 2,
                    fontSize: "0.75rem",
                    color: "#6b7280",
                  }}
                >
                  (Hours / Minutes) learned
                </p>
              </div>
            </div>

            
            <div
              style={{
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                padding: 20,
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: "#6b7280",
                    }}
                  >
                    Graph
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                    }}
                  >
                    All parts
                  </p>
                </div>
              </div>

              <div style={{ minHeight: 240 }}>
                {loading && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#9ca3af",
                      textAlign: "center",
                      marginTop: 40,
                    }}
                  >
                    Loading chart...
                  </p>
                )}

                {!loading && orderedHistory.length === 0 && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#9ca3af",
                      textAlign: "center",
                      marginTop: 40,
                    }}
                  >
                    &lt;Create your own data visualization graph or table&gt;
                  </p>
                )}

                {!loading && orderedHistory.length > 0 && (
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: { min: 0, max: 10 },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            
            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => router.push("/word-of-the-day")}
                style={{
                  padding: "10px 28px",
                  borderRadius: 999,
                  border: "none",
                  background: "#064e3b",
                  color: "white",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Take the test
              </button>
            </div>
          </section>
        </div>
      </div></main>
  );
}
