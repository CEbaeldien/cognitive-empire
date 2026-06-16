"use client";

import { useState } from "react";
import { CEMark } from "@/app/components/CEMark";
import { OverviewTab } from "./tabs/OverviewTab";
import { LawsTab } from "./tabs/LawsTab";
import { MigrationsTab } from "./tabs/MigrationsTab";
import { ManuscriptTab } from "./tabs/ManuscriptTab";
import { LexiconTab } from "./tabs/LexiconTab";
import { MetricsTab } from "./tabs/MetricsTab";
import { ApplyTab } from "./tabs/ApplyTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "laws", label: "Laws" },
  { id: "migrations", label: "Migrations" },
  { id: "manuscript", label: "Manuscript" },
  { id: "lexicon", label: "Lexicon" },
  { id: "metrics", label: "Metrics" },
  { id: "apply", label: "Apply" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DoctrineConsole() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  function goTo(tab: TabId) {
    setActiveTab(tab);
  }

  return (
    <div className="ce-doctrine">
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(5,7,11,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--ce-border)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 10,
                border: "1px solid var(--ce-gold-border)",
                background: "var(--ce-gold-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CEMark style={{ width: 18, height: 18, color: "var(--ce-gold)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ce-white)", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                CE Doctrine OS
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ce-muted)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                OPERATOR KERNEL INTERNAL CONSOLE
              </div>
            </div>
          </div>

          {/* Desktop tabs */}
          <nav className="doctrine-tabs-desktop" style={{ display: "flex", gap: 4 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid transparent",
                  background: activeTab === tab.id ? "var(--ce-gold-soft)" : "transparent",
                  color: activeTab === tab.id ? "var(--ce-gold)" : "var(--ce-muted)",
                  borderColor: activeTab === tab.id ? "var(--ce-gold-border)" : "transparent",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile dropdown */}
          <select
            className="doctrine-tabs-mobile"
            value={activeTab}
            onChange={(e) => goTo(e.target.value as TabId)}
            style={{
              display: "none",
              width: "100%",
              background: "var(--ce-navy)",
              border: "1px solid var(--ce-border)",
              borderRadius: 8,
              color: "var(--ce-text)",
              fontSize: 13,
              padding: "8px 10px",
            }}
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 80px" }}>
        <div key={activeTab} className="ce-reveal">
          {activeTab === "overview" && <OverviewTab onNavigate={goTo} />}
          {activeTab === "laws" && <LawsTab />}
          {activeTab === "migrations" && <MigrationsTab />}
          {activeTab === "manuscript" && <ManuscriptTab />}
          {activeTab === "lexicon" && <LexiconTab onNavigate={goTo} />}
          {activeTab === "metrics" && <MetricsTab />}
          {activeTab === "apply" && <ApplyTab />}
        </div>
      </main>

      <style>{`
        @media (max-width: 760px) {
          .doctrine-tabs-desktop { display: none !important; }
          .doctrine-tabs-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export type { TabId };
