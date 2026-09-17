import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

export const STORAGE_KEYS = {
  settings: "mdwa.settings",
  morningPages: "mdwa.morning-pages",
  sessions: "mdwa.sessions",
};

export const defaultSettings = {
  type: "minutes",
  limit: 5,
  hardcore: false,
  warningSound: false,
};

export function readSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}") };
  } catch {
    return defaultSettings;
  }
}

export function saveEntry(key, entry) {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  localStorage.setItem(key, JSON.stringify([entry, ...existing]));
}

const navItems = [
  { to: "/morning-pages", label: "Morning Pages", icon: "icon-sun" },
  { to: "/sessions", label: "Sessions", icon: "icon-history" },
  { to: "/settings", label: "Settings", icon: "icon-cog" },
];

export function AppShell({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const inWriting = location.pathname === "/write";

  return (
    <div className={`workspace ${inWriting ? "workspace-writing" : ""}`}>
      {!inWriting && (
        <>
          <aside className={`sidebar ${open ? "is-open" : ""}`}>
            <Link to="/" className="sidebar-brand" aria-label="Go to home">
              <span className="brand-mark">MDWA</span>
              <span className="brand-name">The Most Dangerous<br />Morning Pages</span>
            </Link>
            <nav aria-label="Main navigation" className="sidebar-nav">
              {navItems.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setOpen(false)}>
                  <i className={icon} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-footer">Keep the words moving.</div>
          </aside>
          <button className="sidebar-toggle" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>☰</button>
        </>
      )}
      <main className="workspace-main">{children || <Outlet />}</main>
    </div>
  );
}

export function HistoryPage({ morning = false }) {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    const key = morning ? STORAGE_KEYS.morningPages : STORAGE_KEYS.sessions;
    setEntries(JSON.parse(localStorage.getItem(key) || "[]"));
  }, [morning]);
  return (
    <section className="history-page">
      <div className="page-heading">
        <p className="eyebrow">{morning ? "A daily practice" : "Your writing archive"}</p>
        <h1>{morning ? "Morning Pages" : "Sessions"}</h1>
        <p>{morning ? "Three pages, one clear mind. Start with 750 words." : "Every completed session, kept in one place."}</p>
        <Link className="primary-action" to={morning ? "/write?morning=true&type=words&limit=750" : "/write"}>{morning ? "Start Morning Pages" : "Start Writing"}</Link>
      </div>
      <div className="history-list">
        {entries.length === 0 ? <div className="history-empty"><span className="empty-mark">—</span><h2>No completed sessions yet</h2><p>Your finished writing sessions will appear here.</p></div> : entries.map((entry) => (
          <article className="history-card" key={entry.id}>
            <div><time>{new Date(entry.finishedAt).toLocaleString()}</time><span className="history-meta">{entry.words || 0} words · {entry.type === "words" ? `${entry.limit} word goal` : `${entry.limit} minute goal`}</span></div>
            <p>{entry.text || "No text recorded."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState(readSettings);
  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
  };
  const limits = settings.type === "words" ? [150, 250, 500, 750, 1667] : [3, 5, 10, 15, 20, 30, 60];
  return <section className="settings-page"><div className="page-heading"><p className="eyebrow">Make it yours</p><h1>Settings</h1><p>These defaults will be used whenever you start a new session.</p></div><div className="settings-card"><label>Goal measured in<select value={settings.type} onChange={(e) => update("type", e.target.value)}><option value="minutes">Minutes</option><option value="words">Words</option></select></label><label>Default goal<select value={settings.limit} onChange={(e) => update("limit", Number(e.target.value))}>{limits.map((limit) => <option key={limit} value={limit}>{limit} {settings.type}</option>)}</select></label><label className="setting-toggle"><span><strong>Hardcore mode</strong><small>One pause can end the session.</small></span><input type="checkbox" checked={settings.hardcore} onChange={(e) => update("hardcore", e.target.checked)} /><span className="toggle-ui" /></label><label className="setting-toggle"><span><strong>Warning sound</strong><small>Gradually raises a quiet tone during the pause warning.</small></span><input type="checkbox" checked={settings.warningSound} onChange={(e) => update("warningSound", e.target.checked)} /><span className="toggle-ui" /></label></div></section>;
}
