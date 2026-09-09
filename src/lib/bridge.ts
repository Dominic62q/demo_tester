const BRIDGE = (import.meta.env.VITE_BRIDGE_URL as string | undefined) || "http://127.0.0.1:5050";
const TOKEN = (import.meta.env.VITE_BRIDGE_TOKEN as string | undefined) || "";

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BRIDGE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(TOKEN ? { "X-Bridge-Token": TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T & { errorCode?: string };
  if (!res.ok) throw new BridgeError(data.errorCode ?? `HTTP_${res.status}`);
  return data;
}

export class BridgeError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function bridgeMessage(code: string): string {
  switch (code) {
    case "BRIDGE_BUSY": return "Reader is busy — one moment.";
    case "CAPTURE_TIMEOUT": return "No finger seen — press firmly and hold still.";
    case "DEVICE_NOT_FOUND": return "Reader not detected — check the USB cable.";
    case "BAD_TEMPLATE": return "Stored print looks corrupt — re-enrol this person.";
    default: return code;
  }
}

export interface IdentifyCandidate { id: string; templateBase64: string; }
export interface IdentifyResult { matched: boolean; matchId: string | null; score: number; }

export const bridge = {
  status: async (): Promise<{ connected: boolean; busy: boolean }> => {
    const res = await fetch(`${BRIDGE}/api/v1/device/status`, {
      headers: { ...(TOKEN ? { "X-Bridge-Token": TOKEN } : {}) },
    });
    if (!res.ok) throw new BridgeError("BRIDGE_DOWN");
    return (await res.json()) as { connected: boolean; busy: boolean };
  },
  capture: async (timeoutSeconds = 30): Promise<string> => {
    const d = await post<{ templateBase64: string }>("/api/v1/capture", { timeoutSeconds });
    return d.templateBase64;
  },
  merge: async (templates: string[]): Promise<string> => {
    const d = await post<{ templateBase64: string }>("/api/v1/merge", { templates });
    return d.templateBase64;
  },
  identify: async (candidates: IdentifyCandidate[], timeoutSeconds = 30): Promise<IdentifyResult> => {
    return post<IdentifyResult>("/api/v1/identify", { candidates, timeoutSeconds });
  },
};
