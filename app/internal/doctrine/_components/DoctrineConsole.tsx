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
  { id: "overview", label: "Overview", short: "OVR" },
  { id: "laws", label: "Laws", short: "LAW" },
  { id: "migrations", label: "Migrations", short: "MIG" },
  { id: "manuscript", label: "Manuscript", short: "MAN" },
  { id: "lexicon", label: "Lexicon", short: "LEX" },
  { id: "metrics", label: "Metrics", short: "MET" },
  { id: "apply", label: "Apply", short: "APL" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DoctrineConsole() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  function goTo(tab: TabId) {
    setActiveTab(tab);
  }

  return (
    <div className="ce-doctrine">
      <header className="doctrine-shell-header">
        <div className="doctrine-shell-status">
          <span>INTERNAL DOCTRINE INTERFACE</span>
          <span>CANON LOCKED</span>
          <span>SESSION ACTIVE</span>
        </div>

        <div className="doctrine-shell-topbar">
          <div className="doctrine-brand-lockup">
            <div className="doctrine-brand-mark">
              <CEMark className="doctrine-brand-icon" />
            </div>
            <div className="doctrine-brand-copy">
              <div className="doctrine-brand-title">
                CE Doctrine OS
              </div>
              <div className="doctrine-brand-subtitle">
                OPERATOR KERNEL INTERNAL CONSOLE
              </div>
            </div>
          </div>

          <nav className="doctrine-tabs-desktop" aria-label="Doctrine sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className="doctrine-tab-button"
                data-active={activeTab === tab.id}
                type="button"
              >
                <span className="doctrine-tab-code">{tab.short}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <select
            className="doctrine-tabs-mobile"
            value={activeTab}
            onChange={(e) => goTo(e.target.value as TabId)}
            aria-label="Doctrine section"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="doctrine-shell-main">
        <aside className="doctrine-side-panel" aria-label="Doctrine status">
          <div className="doctrine-panel-kicker">Console State</div>
          <div className="doctrine-side-title">Doctrine authority layer</div>
          <div className="doctrine-side-copy">
            Internal operating interface for reading, applying, and governing the Operator Kernel.
          </div>

          <div className="doctrine-status-list">
            <StatusRow label="Canonical laws" value="8" />
            <StatusRow label="Manuscript" value="19 + 4" />
            <StatusRow label="Mode" value={activeTab.toUpperCase()} />
            <StatusRow label="Persistence" value="Local notes" />
          </div>
        </aside>

        <div className="doctrine-content-frame">
          <div className="doctrine-content-header">
            <div>
              <div className="doctrine-panel-kicker">Active Surface</div>
              <h1>{TABS.find((tab) => tab.id === activeTab)?.label}</h1>
            </div>
            <div className="doctrine-content-seal">CE</div>
          </div>

          <div key={activeTab} className="ce-reveal doctrine-tab-surface">
            {activeTab === "overview" && <OverviewTab onNavigate={goTo} />}
            {activeTab === "laws" && <LawsTab />}
            {activeTab === "migrations" && <MigrationsTab />}
            {activeTab === "manuscript" && <ManuscriptTab />}
            {activeTab === "lexicon" && <LexiconTab onNavigate={goTo} />}
            {activeTab === "metrics" && <MetricsTab />}
            {activeTab === "apply" && <ApplyTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="doctrine-status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export type { TabId };
