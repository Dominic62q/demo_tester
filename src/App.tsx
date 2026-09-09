import { useEffect, useState } from "react";
import Kiosk from "./components/Kiosk";
import SettingsPage from "./components/SettingsPage";
import Shell, { type Page } from "./components/Shell";
import StaffPage from "./components/StaffPage";
import { DEFAULT_SETTINGS, loadSettings } from "./lib/settings";
import "./styles.css";

export default function App() {
  const [page, setPage] = useState<Page>("kiosk");
  const [company, setCompany] = useState(DEFAULT_SETTINGS.companyName);

  const refreshCompany = async () => {
    const s = await loadSettings();
    setCompany(s.companyName);
  };

  useEffect(() => { void refreshCompany(); }, []);

  return (
    <Shell page={page} go={setPage} company={company}>
      {page === "kiosk" && <Kiosk onClocked={() => undefined} />}
      {page === "staff" && <StaffPage onChanged={refreshCompany} />}
      {page === "settings" && <SettingsPage onSaved={refreshCompany} />}
    </Shell>
  );
}
