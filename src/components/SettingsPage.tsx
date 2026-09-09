import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../lib/settings";

export default function SettingsPage({ onSaved }: { onSaved: () => void }) {
  const [company, setCompany] = useState(DEFAULT_SETTINGS.companyName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setCompany(s.companyName);
    });
  }, []);

  const save = async () => {
    await saveSettings({ companyName: company.trim() || DEFAULT_SETTINGS.companyName });
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="card">
      <h2>Workplace settings</h2>
      <div className="row">
        <label className="field">Company name<input type="text" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
      </div>
      <button className="btn" onClick={save}>Save</button>
      {saved && <p className="progress">Saved.</p>}
    </section>
  );
}
