import { useRef, useState } from "react";
import { bridge, BridgeError } from "../lib/bridge";

type St =
  | { k: "ready" }
  | { k: "reading" }
  | { k: "retry"; message: string }
  | { k: "combining" };

/**
 * Guided 3-touch finger capture with honest progress. One touch at a time;
 * a failed touch retries just that touch, never the whole flow.
 */
export default function FingerScan({ title, sub, onDone, onCancel }: {
  title: string;
  sub: string;
  onDone: (mergedTemplate: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [prints, setPrints] = useState<string[]>([]);
  const [st, setSt] = useState<St>({ k: "ready" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);
  const inflight = useRef(false);

  const touch = async () => {
    if (inflight.current || saving) return;
    inflight.current = true;
    setError(null);
    setSt({ k: "reading" });
    try {
      const t = await bridge.capture(30);
      if (cancelled.current) return;
      const next = [...prints, t];
      setPrints(next);
      if (next.length >= 3) {
        setSt({ k: "combining" });
        setSaving(true);
        try {
          const merged = await bridge.merge(next);
          if (!cancelled.current) await onDone(merged);
        } catch {
          if (!cancelled.current) {
            setError("I couldn't combine those touches — let's take them again.");
            setPrints([]);
            setSt({ k: "ready" });
          }
        } finally {
          if (!cancelled.current) setSaving(false);
        }
      } else {
        setSt({ k: "ready" });
      }
    } catch (e) {
      if (cancelled.current) return;
      const code = e instanceof BridgeError ? e.code : "";
      setSt({
        k: "retry",
        message:
          code === "CAPTURE_TIMEOUT"
            ? "I didn't feel a finger there — press firmly, hold still, and try this touch again."
            : code === "BRIDGE_BUSY"
              ? "The reader was busy — wait a second and try this touch again."
              : code === "DEVICE_NOT_FOUND"
                ? "The reader isn't plugged in — check the cable, then try again."
                : code === "UNAUTHORIZED"
                  ? "This page isn't paired with the reader program on this PC."
                  : "That touch didn't take — try it again.",
      });
    } finally {
      inflight.current = false;
    }
  };

  const cancel = () => {
    cancelled.current = true;
    onCancel();
  };

  const n = prints.length;
  const coach =
    st.k === "combining" ? "Combining the three touches…" :
    st.k === "reading" ? `Touch ${n + 1} of 3 — press the same finger firmly, hold still…` :
    st.k === "retry" ? st.message :
    n === 0 ? "Touch 1 of 3 — press the same finger firmly on the reader." :
    n === 1 ? "Got it — lift, then touch 2 of 3 with the same finger." :
    "Last one — lift, then touch 3 of 3.";

  return (
    <div className="kiosk-stage">
      <h3>{title}</h3>
      <p className="muted">{sub}</p>
      <div className={st.k === "reading" || st.k === "combining" ? "scanner live" : st.k === "retry" ? "scanner no" : "scanner"}>
        {st.k === "combining" ? "◌" : st.k === "retry" ? "!" : n === 3 ? "✓" : "▣"}
      </div>
      <div className="dots" aria-label={`${n} of 3 touches done`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < n ? "dot on" : "dot"} />
        ))}
      </div>
      <p className={st.k === "retry" ? "alert" : "muted"}>{coach}</p>
      {st.k === "ready" && (
        <button className="finger-btn" onClick={touch}>
          {n === 0 ? "Start — then touch the reader" : `Touch ${n + 1} of 3`}
        </button>
      )}
      {st.k === "retry" && (
        <button className="finger-btn" onClick={touch}>Try touch {n + 1} again</button>
      )}
      {(st.k === "reading" || st.k === "combining") && (
        <button className="finger-btn" disabled>{st.k === "combining" ? "Combining…" : "Reading… keep your finger still"}</button>
      )}
      {error && <p className="alert">{error}</p>}
      <button className="btn ghost" onClick={cancel} disabled={saving}>Cancel</button>
    </div>
  );
}
