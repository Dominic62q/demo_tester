import { useEffect, useState } from "react";
import FingerScan from "./FingerScan";
import { addStaff, deleteStaff, listStaff, updateStaff, type Staff } from "../lib/store";

type Mode =
  | { k: "list" }
  | { k: "details" }
  | { k: "scan" }
  | { k: "rescan"; person: Staff };

export default function StaffPage({ onChanged }: { onChanged: () => void }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [mode, setMode] = useState<Mode>({ k: "list" });
  const [name, setName] = useState("");
  const [staffNo, setStaffNo] = useState("");
  const [department, setDepartment] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => setStaff(await listStaff());
  useEffect(() => { void refresh(); }, []);

  const departments = [...new Set(staff.map((s) => s.department).filter(Boolean))];

  const startAdd = () => {
    setError(null);
    setNotice(null);
    setMode({ k: "details" });
  };

  const finishAdd = async (merged: string) => {
    try {
      await addStaff(name.trim(), staffNo.trim(), department.trim() || "General", merged);
      setNotice(`${name.trim()}'s finger is saved — they can sign in now.`);
      setName(""); setStaffNo(""); setDepartment("");
      setMode({ k: "list" });
      await refresh();
      onChanged();
    } catch {
      setError("Couldn't save them just now — try again.");
      setMode({ k: "list" });
    }
  };

  const finishRescan = async (person: Staff, merged: string) => {
    try {
      await updateStaff(person.id, { fingerprintTemplate: merged });
      setNotice(`${person.name}'s new finger is active.`);
      setMode({ k: "list" });
      await refresh();
    } catch {
      setError("Couldn't save the new finger — try again.");
      setMode({ k: "list" });
    }
  };

  const toggleActive = async (s: Staff) => {
    await updateStaff(s.id, { active: !s.active });
    await refresh();
    onChanged();
  };

  const remove = async (s: Staff) => {
    if (!window.confirm(`Remove ${s.name} entirely (including their saved finger)?`)) return;
    await deleteStaff(s.id);
    await refresh();
    onChanged();
  };

  const shown = staff.filter((s) =>
    (dept === "all" || s.department === dept) &&
    (q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.staffNo.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      {mode.k === "details" && (
        <section className="card">
          <h2>Add someone — step 1 of 2</h2>
          <p className="muted">Who is this for? Next you'll take three quick touches of one finger.</p>
          <div className="row">
            <label className="field">Name<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Serwaa" /></label>
            <label className="field">Staff no.<input type="text" value={staffNo} onChange={(e) => setStaffNo(e.target.value)} placeholder="RS-014" /></label>
            <label className="field">Department<input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Front desk" /></label>
          </div>
          <div className="toolbar">
            <button className="btn" onClick={() => name.trim() ? setMode({ k: "scan" }) : setError("Give them a name first.")}>Continue to scan finger →</button>
            <button className="btn ghost" onClick={() => setMode({ k: "list" })}>Back</button>
          </div>
          {error && <p className="alert">{error}</p>}
        </section>
      )}

      {mode.k === "scan" && (
        <section className="card">
          <h2>Add someone — step 2 of 2</h2>
          <FingerScan
            title={`${name.trim()}'s finger`}
            sub="Three touches of the same finger. Lift between touches."
            onDone={finishAdd}
            onCancel={() => setMode({ k: "details" })}
          />
        </section>
      )}

      {mode.k === "rescan" && (
        <section className="card">
          <h2>New finger</h2>
          <FingerScan
            title={`${mode.person.name}'s finger`}
            sub="Three touches of the same finger. This replaces the old one."
            onDone={(m) => finishRescan(mode.person, m)}
            onCancel={() => setMode({ k: "list" })}
          />
        </section>
      )}

      {mode.k === "list" && (
        <section className="card">
          <h2>Add someone</h2>
          <p className="muted">Two quick steps: their details, then three touches of one finger.</p>
          <button className="btn" onClick={startAdd}>Add someone</button>
          {notice && <p className="progress">{notice}</p>}
          {error && <p className="alert">{error}</p>}
        </section>
      )}

      <section className="card">
        <h2>Everyone ({shown.length})</h2>
        <div className="toolbar">
          <label className="field">Department
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">All</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="field search">Search<input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or staff no." /></label>
        </div>
        <table className="reg">
          <thead><tr><th>Name</th><th>No.</th><th>Department</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td className="mono">{s.staffNo || "—"}</td>
                <td>{s.department || "—"}</td>
                <td>{s.active ? <span className="chip">active</span> : <span className="chip dim">paused</span>}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn ghost" onClick={() => { setError(null); setNotice(null); setMode({ k: "rescan", person: s }); }}>New finger</button>{" "}
                  <button className="btn ghost" onClick={() => toggleActive(s)}>{s.active ? "Pause" : "Resume"}</button>{" "}
                  <button className="btn ghost danger" onClick={() => remove(s)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="muted">Nobody here yet — add your first person above.</p>}
      </section>
    </div>
  );
}
