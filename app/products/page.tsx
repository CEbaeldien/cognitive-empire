export default function ProductsPage() {
  return (
    <main className="ce-subpage">
      <nav className="ce-subnav">
        <a href="/home" className="ce-backlink">← Back to Home</a>
        <div className="ce-subnav-title">Products</div>
      </nav>

      <section className="ce-subhero">
        <p className="ce-page-tag">PRODUCTS</p>
        <h1 className="ce-page-title">Products</h1>
        <p className="ce-page-subtitle">
          Execution systems and strategic products built under Cognitive Empire.
        </p>
      </section>

      <section className="ce-page-section">
        <h2>Current</h2>
        <p>
          EdgeTwin and AI in 2026 are the first live product artifacts in the Cognitive Empire ecosystem.
        </p>
      </section>
    </main>
  );
}