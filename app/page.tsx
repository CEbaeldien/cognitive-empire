"use client";

import { useEffect } from "react";

export default function EntryPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/home";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="entry-page">
      <div className="entry-content">
        <p className="entry-label">COGNITIVE EMPIRE</p>
        <h1 className="entry-title">Judgment is Power</h1>
        <p className="entry-subtitle">
          Doctrine. Systems. Execution Infrastructure.
        </p>
        <p className="entry-note">Entering the Empire...</p>
      </div>
    </main>
  );
}