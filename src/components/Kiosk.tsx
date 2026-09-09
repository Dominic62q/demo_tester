import { useEffect, useRef, useState } from "react";
import { bridge, BridgeError, type IdentifyCandidate } from "../lib/bridge";
import { listStaff, signIn } from "../lib/store";

type Phase =
  | { k: "idle" }
  | { k: "scanning" }
  | { k: "done"; name: string; time: Date }
  | { k: "unknown" }
  | { k: "error"; message: string };

function friendly(code: string): string {
  switch (code) {
    case "BRIDGE_BUSY": return "Someone just used the reader — wait a moment and try again.";
    case "CAPTURE_TIMEOUT": return "I didn't catch that — press firmly, hold still a second, try again.";
    case "DEVICE_NOT_FOUND": return "The fingerprint reader isn't plugged in.";
    case "BRIDGE_DOWN": return "The fingerprint program isn't running on this PC.";
    default: return "Something hiccuped — try again.";
  }
}

export default function Kiosk({ onClocked }: { onClocked: () => void }) {
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const inflight = useRef(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const autoReset = () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setPhase({ k: "idle" }), 4000);
  };

  const clock = async () => {
    if (inflight.current) return; // second click of a double-click: ignore, never error
    inflight.current = true;
    setPhase({ k: "scanning" });
    try {
      const staff = (await listStaff(true)).filter((s) => s.fingerprintTemplate);
      if (staff.length === 0) {
        setPhase({ k: "error", message: "Nobody's fingerprint is saved yet — add people under Team first." });
        autoReset();
        return;
      }
      const candidates: IdentifyCandidate[] = staff.map((s) => ({ id: s.id, templateBase64: s.fingerprintTemplate }));
      const r = await bridge.identify(candidates, 30);
      if (!r.matched || !r.matchId) {
        setPhase({ k: "unknown" });
        autoReset();
        return;
      }
      const person = staff.find((s) => s.id === r.matchId)!;
      const time = await signIn(person.id, person.name, person.department);
      setPhase({ k: "done", name: person.name, time });
      onClocked();
    } catch (e) {
      const message = e instanceof BridgeError ? friendly(e.code) : "Something hiccuped — try again.";
      setPhase({ k: "error", message });
      autoReset();
    } finally {
      inflight.current = false;
    }
  };

  const face =
    phase.k === "scanning" ? "◌" :
    phase.k === "done" ? "✓" :
    phase.k === "unknown" ? "?" :
    phase.k === "error" ? "!" : "▣";
  const faceClass =
    phase.k === "scanning" ? "scanner live" :
    phase.k === "done" ? "scanner ok" :
    phase.k === "unknown" || phase.k === "error" ? "scanner no" : "scanner";

  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="card">
      <h2>Sign in with your finger</h2>
      <p className="muted">Touch the reader — the system recognizes you and signs you in.</p>
      <div className="kiosk-stage">
        <div className={faceClass}>{face}</div>
        {phase.k !== "scanning" ? (
          <button className="finger-btn" onClick={clock}>Start — then touch the reader</button>
        ) : (
          <button className="finger-btn" disabled>Reading… keep your finger still</button>
        )}
        <div className="result">
          {phase.k === "done" && (
            <>
              <span className="chip">signed in</span>
              <p className="who">Hello, {phase.name}</p>
              <p className="meta">{fmtTime(phase.time)}</p>
            </>
          )}
          {phase.k === "unknown" && (
            <p className="alert">Hmm, I don't recognize that finger. Try again — or ask to be added under Team.</p>
          )}
          {phase.k === "error" && <p className="alert">{phase.message}</p>}
        </div>
      </div>
    </section>
  );
}
