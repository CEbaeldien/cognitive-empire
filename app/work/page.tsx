export default function WorkPage() {
  return (
    <main className="ce-subpage">
      <nav className="ce-subnav">
        <a href="/home" className="ce-backlink">← Back to Home</a>
        <div className="ce-subnav-title">Work</div>
      </nav>

      <section className="ce-subhero">
        <p className="ce-page-tag">WORK</p>
        <h1 className="ce-page-title">Work</h1>
        <p className="ce-page-subtitle">
          Systems architecture, AI workflows, and execution infrastructure.
        </p>
      </section>

      <section className="ce-page-section">
        <h2>What We Do</h2>
        <p>
          Cognitive Empire designs workflow architecture, agent systems,
          and execution environments for serious operators and modern organizations.
        </p>
      </section>
    </main>
  );
}