
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Worddee.ai",
  description: "Practice writing English sentences with Word of the Day",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: "#7f9090",
          color: "#111827",
        }}
      >
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              <span style={{ fontSize: "1.1rem" }}>worddee.</span>
              <span style={{ fontSize: "1.1rem", opacity: 0.7 }}>ai</span>
            </div>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                fontSize: "0.9rem",
              }}
            >
              <Link
                href="/dashboard"
                style={{ color: "#0ea5e9", textDecoration: "none" }}
              >
                My Progress
              </Link>
              <Link
                href="/word-of-the-day"
                style={{ color: "#0ea5e9", textDecoration: "none" }}
              >
                Word of the Day
              </Link>

              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  border: "2px solid #0ea5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  color: "#0ea5e9",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                </svg>
              </div>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
