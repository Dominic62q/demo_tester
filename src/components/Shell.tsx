import type { ReactNode } from "react";

export type Page = "kiosk" | "staff" | "settings";

const ITEMS: { id: Page; label: string; hint: string }[] = [
  { id: "kiosk", label: "Clock in", hint: "Fingerprint terminal" },
  { id: "staff", label: "Team", hint: "People & fingerprints" },
  { id: "settings", label: "Settings", hint: "Company" },
];

export default function Shell({ page, go, company, children }: {
  page: Page; go: (p: Page) => void; company: string; children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">{company}</div>
            <div className="brand-sub">Attendance</div>
          </div>
        </div>
        <nav>
          {ITEMS.map((it) => (
            <button key={it.id} className={page === it.id ? "on" : ""} onClick={() => go(it.id)}>
              <span className="nav-label">{it.label}</span>
              <span className="nav-hint">{it.hint}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">Fingerprint sign-in · works offline-first on this PC</div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
