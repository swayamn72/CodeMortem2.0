"use client";

import { useRouter } from "next/navigation";

export interface PrerequisiteItem {
  title: string;
  description: string;
}

export interface PrerequisitesProps {
  title?: string;
  subtitle?: string;
  items: PrerequisiteItem[];
  onContinue: () => void;
  onNotReady?: () => void;
}

export default function PrerequisitesScreen({
  title = "Prerequisites: Before You Enter the Matrix",
  subtitle = "To survive this masterclass, check your inventory:",
  items,
  onContinue,
  onNotReady,
}: PrerequisitesProps) {
  const router = useRouter();

  const handleNotReady = () => {
    if (onNotReady) {
      onNotReady();
    } else {
      router.push("/learn");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        padding: "40px 20px",
        background: "var(--bg-primary)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          padding: "32px",
          border: "1px solid var(--border-primary)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          margin: "0 auto auto auto",
        }}
      >
        <h1
          style={{
            fontSize: "var(--font-size-xl)",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "8px",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          {subtitle}
        </p>

        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px",
            background: "var(--bg-primary)",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            maxHeight: "350px",
            overflowY: "auto",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                borderBottom: i < items.length - 1 ? "1px solid var(--border-primary)" : "none",
                paddingBottom: i < items.length - 1 ? "16px" : "0",
              }}
            >
              <h3
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "32px",
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={handleNotReady}
            style={{
              padding: "12px 24px",
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
            }}
          >
            I'm scared. Take me home.
          </button>
          <button
            className="btn btn-primary"
            onClick={onContinue}
            style={{
              padding: "12px 32px",
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
            }}
          >
            I'm ready. Let's go.
          </button>
        </div>
      </div>
    </div>
  );
}
