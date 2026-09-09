import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy,
  query, serverTimestamp, setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Staff {
  id: string;
  name: string;
  staffNo: string;
  department: string;
  active: boolean;
  fingerprintTemplate: string;
  createdAt: unknown;
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export async function listStaff(activeOnly = false): Promise<Staff[]> {
  // NOTE: no where+orderBy combo — that needs a Firestore composite index.
  // Filter client-side; team sizes here are small.
  const snap = await getDocs(query(collection(db, "staff"), orderBy("name")));
  const all = snap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<Staff, "id">) }));
  return activeOnly ? all.filter((s) => s.active !== false) : all;
}

export async function addStaff(name: string, staffNo: string, department: string, fingerprintTemplate: string): Promise<string> {
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  await setDoc(doc(db, "staff", id), {
    name, staffNo, department, active: true, fingerprintTemplate, createdAt: serverTimestamp(),
  });
  return id;
}

export async function updateStaff(id: string, patch: Partial<Pick<Staff, "name" | "staffNo" | "department" | "active" | "fingerprintTemplate">>): Promise<void> {
  await setDoc(doc(db, "staff", id), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteStaff(id: string): Promise<void> {
  await deleteDoc(doc(db, "staff", id));
}

/** Sign-in only: every touch records today's arrival time. */
export async function signIn(staffId: string, name: string, department: string): Promise<Date> {
  const date = todayKey();
  const now = new Date();
  await setDoc(doc(db, "attendance", `${date}_${staffId}`), {
    staffId, name, department, date, clockIn: now, clockOut: null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return now;
}

