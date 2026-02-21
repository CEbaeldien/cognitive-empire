export default function Home() {
  return (
    <main
      style={{
        fontFamily: "system-ui",
        padding: "80px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <p style={{ opacity: 0.6, letterSpacing: 2, fontSize: 12 }}>
            COGNITIVE EMPIRE
          </p>

          <h1
            style={{
              fontSize: 72,
              lineHeight: 1.05,
              margin: "16px 0",
              fontWeight: 600,
            }}
          >
            Judgment is power.
          </h1>

          <p
            style={{
              fontSize: 20,
              maxWidth: 700,
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            We design doctrine, agents, and infrastructure systems that turn
            clarity into execution.
          </p>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button
            style={{
              padding: "14px 20px",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            Get Updates
          </button>

          <button
            style={{
              padding: "14px 20px",
              background: "transparent",
              border: "1px solid #ddd",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Read the Doctrine
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: 100,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 40,
        }}
      >
        <div>
          <h3>Phase 0</h3>
          <p style={{ opacity: 0.8 }}>
            Publish doctrine. Ship one high-value agent.
          </p>
        </div>

        <div>
          <h3>Now Shipping</h3>
          <p style={{ opacity: 0.8 }}>
            AI in 2026: Intelligence Is Cheap. Judgment Is Power.
          </p>
        </div>

        <div>
          <h3>In Development</h3>
          <p style={{ opacity: 0.8 }}>
            EdgeTwin — Revenue Operating Engine for operators.
          </p>
        </div>
      </section>

      <footer style={{ marginTop: 120, opacity: 0.5 }}>
        © {new Date().getFullYear()} Cognitive Empire
      </footer>
    </main>
  );
}