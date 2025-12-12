
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "40px 0",
        background: "#7f9090",
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          background: "#7f9090",
          borderRadius: 16,
          padding: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: 32,
            maxWidth: 640,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 12 }}>Welcome to Worddee.ai</h1>
          <p style={{ marginTop: 0, marginBottom: 20, color: "#6b7280" }}>
            Practice writing a meaningful sentence using today&apos;s word, and
            track your learning progress over time.
          </p>
          <Link
            href="/word-of-the-day"
            style={{
              display: "inline-block",
              padding: "10px 26px",
              borderRadius: 999,
              background: "#064e3b",
              color: "white",
              fontSize: "0.95rem",
            }}
          >
            Go to Word of the Day
          </Link>
        </div>
      </div>
    </main>
  );
}
