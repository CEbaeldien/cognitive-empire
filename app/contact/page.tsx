export default function ContactPage() {
  return (
    <main className="ce-subpage">
      <nav className="ce-subnav">
        <a href="/home" className="ce-backlink">← Back to Home</a>
        <div className="ce-subnav-title">Contact</div>
      </nav>

      <section className="ce-subhero">
        <p className="ce-page-tag">CONTACT</p>
        <h1 className="ce-page-title">Contact</h1>
        <p className="ce-page-subtitle">
          Partnerships, systems work, and product interest.
        </p>
      </section>

      <section className="ce-page-section">
        <h2>Email</h2>
        <p>
          contact@cognitiveempire.com
        </p>
      </section>
    </main>
  );
}