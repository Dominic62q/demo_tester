import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface AppSettings {
  companyName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Roster Demo Company",
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", "app"));
    if (snap.exists()) {
      const d = snap.data() as Partial<AppSettings>;
      return {
        companyName:
          typeof d.companyName === "string" && d.companyName.trim()
            ? d.companyName.trim()
            : DEFAULT_SETTINGS.companyName,
      };
    }
  } catch {
    /* offline or missing — fall back to defaults */
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(s: AppSettings): Promise<void> {
  await setDoc(doc(db, "settings", "app"), { ...s }, { merge: true });
}
