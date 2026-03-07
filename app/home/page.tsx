"use client";

import { useState } from "react";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="ce-home">
      <div className="ce-grid" />
      <div className="ce-glow" />

      <nav className="ce-nav ce-nav-minimal">
        <div className="ce-menu-wrap">
          <button
            className="ce-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open navigation menu"
          >
            <span />
            <span />
            <span />
          </button>

          {menuOpen && (
            <div className="ce-dropdown-menu">
              <a href="#ai2026" onClick={closeMenu}>AI in 2026</a>
              <a href="#edgetwin" onClick={closeMenu}>EdgeTwin</a>
              <a href="#products" onClick={closeMenu}>Products</a>
              <a href="#work" onClick={closeMenu}>Work</a>
              <a href="#foundrylabs" onClick={closeMenu}>FoundryLabs</a>
              <a href="#contact" onClick={closeMenu}>Contact</a>
            </div>
          )}
        </div>
      </nav>

      <section id="home" className="ce-hero">
        <p className="ce-eyebrow">COGNITIVE EMPIRE</p>
        <h1 className="ce-hero-title">
          Engineering the Infrastructure of Intelligence
        </h1>
        <p className="ce-hero-subtitle">
          Systems, agents, and execution frameworks designed for the AI era.
        </p>
      </section>

      <div className="ce-signal-grid ce-home-signal-grid">
        <div className="ce-signal-card">
          <p className="ce-signal-label">FRAMEWORK</p>
          <a href="#ai2026" className="ce-card-link">
            <h3>AI in 2026</h3>
          </a>
          <p>Strategic framework for the intelligence era.</p>
        </div>

        <div className="ce-signal-card">
          <p className="ce-signal-label">PRODUCT</p>
          <a href="#edgetwin" className="ce-card-link">
            <h3>EdgeTwin</h3>
          </a>
          <p>Revenue execution engine for operators.</p>
        </div>

        <div className="ce-signal-card">
          <p className="ce-signal-label">RESEARCH</p>
          <a href="#foundrylabs" className="ce-card-link">
            <h3>FoundryLabs</h3>
          </a>
          <p>Applied research and engineering division.</p>
        </div>
      </div>

      <section id="ai2026" className="ce-section">
        <div className="ce-section-inner">
          <p className="ce-section-tag">FRAMEWORK</p>
          <h2>AI in 2026</h2>
          <p className="ce-section-text">
            A strategic framework explaining the structural shift created by
            cheap intelligence, agent systems, and collapsing execution models.
          </p>
          <div className="ce-hero-actions">
            <a href="/ai-in-2026" className="ce-btn ce-btn-secondary">
              Explore the Doctrine
            </a>
          </div>
        </div>
      </section>

      <section id="edgetwin" className="ce-section">
        <div className="ce-section-inner">
          <p className="ce-section-tag">PRODUCT</p>
          <h2>EdgeTwin</h2>
          <p className="ce-section-text">
            A revenue execution engine designed for operators. EdgeTwin detects
            pipeline bottlenecks, tracks conversion mathematics, and enforces
            execution discipline.
          </p>
          <div className="ce-hero-actions">
            <a href="/edgetwin" className="ce-btn ce-btn-primary">
              Explore EdgeTwin
            </a>
          </div>
        </div>
      </section>

      <section id="products" className="ce-section">
        <div className="ce-section-inner">
          <p className="ce-section-tag">PRODUCTS</p>
          <h2>Products</h2>
          <p className="ce-section-text">
            Cognitive Empire products are designed to turn structural clarity
            into execution leverage.
          </p>
          <div className="ce-work-grid">
            <a href="/edgetwin" className="ce-mini-card ce-mini-link">EdgeTwin</a>
            <a href="/ai-in-2026" className="ce-mini-card ce-mini-link">AI in 2026</a>
            <a href="/products" className="ce-mini-card ce-mini-link">View Product Index</a>
          </div>
        </div>
      </section>

      <section id="work" className="ce-section">
        <div className="ce-section-inner">
          <p className="ce-section-tag">WORK</p>
          <h2>Work</h2>
          <p className="ce-section-text">
            Workflow architecture, AI systems, and execution infrastructure for
            operators and modern organizations.
          </p>
          <div className="ce-hero-actions">
            <a href="/work" className="ce-btn ce-btn-secondary">
              View Work
            </a>
          </div>
        </div>
      </section>

      <section id="foundrylabs" className="ce-section">
        <div className="ce-section-inner">
          <p className="ce-section-tag">RESEARCH</p>
          <h2>FoundryLabs</h2>
          <p className="ce-section-text">
            FoundryLabs is the applied research and engineering division of
            Cognitive Empire, focused on experimental systems, infrastructure,
            and advanced applied intelligence frameworks.
          </p>
          <div className="ce-hero-actions">
            <a href="/foundrylabs" className="ce-btn ce-btn-secondary">
              Explore FoundryLabs
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="ce-section ce-section-last">
        <div className="ce-section-inner">
          <p className="ce-section-tag">CONTACT</p>
          <h2>Contact</h2>
          <p className="ce-section-text">
            For partnerships, systems work, and product interest:
          </p>
          <div className="ce-hero-actions">
            <a href="/contact" className="ce-btn ce-btn-secondary">
              Open Contact Page
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}