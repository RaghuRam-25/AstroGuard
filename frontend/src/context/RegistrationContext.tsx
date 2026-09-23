"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getRegistrationStatus,
  startRegistrationWindow,
  closeRegistrationWindow,
  type RegistrationStatus,
} from "../lib/api";

const STORAGE_KEY = "astroguard:registration";
const CHANNEL_NAME = "astroguard:registration";

interface RegistrationContextValue {
  isRegistrationOpen: boolean;
  registrationExpiresAt: number | null;
  expiresInMs: number;
  remainingLabel: string;
  statusLabel: "OPEN" | "CLOSED";
  loading: boolean;
  startRegistration: (durationMinutes: number) => Promise<boolean>;
  closeRegistration: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const RegistrationContext = createContext<RegistrationContextValue>({
  isRegistrationOpen: false,
  registrationExpiresAt: null,
  expiresInMs: 0,
  remainingLabel: "00:00",
  statusLabel: "CLOSED",
  loading: true,
  startRegistration: async () => false,
  closeRegistration: async () => false,
  refresh: async () => undefined,
});

export function useRegistration(): RegistrationContextValue {
  return useContext(RegistrationContext);
}

function readStored(): { isRegistrationOpen: boolean; registrationExpiresAt: number | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.isRegistrationOpen === "boolean") {
      return {
        isRegistrationOpen: Boolean(parsed.isRegistrationOpen),
        registrationExpiresAt:
          typeof parsed.registrationExpiresAt === "number" ? parsed.registrationExpiresAt : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function isExpired(state: { isRegistrationOpen: boolean; registrationExpiresAt: number | null }): boolean {
  return (
    state.isRegistrationOpen &&
    state.registrationExpiresAt !== null &&
    state.registrationExpiresAt <= Date.now()
  );
}

function normalize(state: {
  isRegistrationOpen: boolean;
  registrationExpiresAt: number | null;
}): { isRegistrationOpen: boolean; registrationExpiresAt: number | null } {
  if (isExpired(state)) {
    return { isRegistrationOpen: false, registrationExpiresAt: null };
  }
  return state;
}

/**
 * Cross-tab broadcast bus. Simulates a server push (WebSocket/SSE) channel so a
 * window opened in Mission Control instantly updates the public Navbar in every
 * other browser tab, without a running backend.
 */
function createBroadcast(): {
  channel: BroadcastChannel | null;
  publish: (state: { isRegistrationOpen: boolean; registrationExpiresAt: number | null }) => void;
  close: () => void;
} {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return {
      channel: null,
      publish: () => undefined,
      close: () => undefined,
    };
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  return {
    channel,
    publish: (state) => {
      try {
        channel.postMessage({ type: "REGISTRATION_STATE", state });
      } catch {
        // Ignore cross-tab publish failures in restricted contexts.
      }
    },
    close: () => channel.close(),
  };
}

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const fallback = useMemo(
    () => readStored() ?? { isRegistrationOpen: false, registrationExpiresAt: null },
    []
  );

  const [state, setState] = useState<{ isRegistrationOpen: boolean; registrationExpiresAt: number | null }>(
    () => normalize(fallback)
  );
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const broadcastRef = useRef<ReturnType<typeof createBroadcast>>(null);

  const persist = useCallback(
    (next: { isRegistrationOpen: boolean; registrationExpiresAt: number | null }) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Persist is best-effort (private mode / quota).
      }
      broadcastRef.current?.publish(next);
    },
    []
  );

  const refresh = useCallback(async () => {
    try {
      const res = await getRegistrationStatus();
      if (res.success && res.data) {
        const data = res.data;
        const normalized = normalize({
          isRegistrationOpen: Boolean(data.isRegistrationOpen),
          registrationExpiresAt: data.registrationExpiresAt ?? null,
        });
        const next =
          normalized.registrationExpiresAt !== null && normalized.registrationExpiresAt > Date.now()
            ? normalized
            : normalized;
        setState(next);
        persist(next);
      }
    } catch {
      // Backend offline — keep persisted/local fallback state.
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const startRegistration = useCallback(
    async (durationMinutes: number) => {
      const expiresAt = Date.now() + durationMinutes * 60 * 1000;
      const optimistic: { isRegistrationOpen: boolean; registrationExpiresAt: number } = {
        isRegistrationOpen: true,
        registrationExpiresAt: expiresAt,
      };
      setState(optimistic);
      persist(optimistic);
      try {
        const res = await startRegistrationWindow(durationMinutes);
        if (res.success && res.data) {
          const data = res.data;
          const next = {
            isRegistrationOpen: Boolean(data.isRegistrationOpen),
            registrationExpiresAt: data.registrationExpiresAt ?? expiresAt,
          };
          setState(next);
          persist(next);
        }
        return res.success;
      } catch {
        return true; // optimistic local state still applies (mock mode)
      }
    },
    [persist]
  );

  const closeRegistration = useCallback(async () => {
    const closed = { isRegistrationOpen: false as const, registrationExpiresAt: null };
    setState(closed);
    persist(closed);
    try {
      const res = await closeRegistrationWindow();
      return res.success;
    } catch {
      return true; // optimistic local state still applies (mock mode)
    }
  }, [persist]);

  // Auto-expiry tick — refreshes the now timestamp every second so the countdown
  // ticks and expired windows self-heal back to CLOSED.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Heal an expired window: reset state + persisted gate (async render-safe).
  useEffect(() => {
    if (!isExpired(state)) return;
    const closed = { isRegistrationOpen: false as const, registrationExpiresAt: null };
    const frame = window.requestAnimationFrame(() => {
      setState(closed);
      persist(closed);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state, persist]);

  // Initial hydration: restore persisted gate, then reconcile with the server.
  useEffect(() => {
    const restored = readStored();
    const frame = window.requestAnimationFrame(() => {
      if (restored) {
        const normalized = normalize(restored);
        setState(normalized);
        persist(normalized);
      }
      void refresh();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [refresh, persist]);

  // Subscribe to cross-tab broadcasts (real-time sync across windows).
  useEffect(() => {
    broadcastRef.current = createBroadcast();
    const channel = broadcastRef.current.channel;
    if (channel) {
      const onMessage = (event: MessageEvent) => {
        const payload = event.data;
        if (payload && payload.type === "REGISTRATION_STATE" && payload.state) {
          const normalized = normalize(payload.state);
          setState(normalized);
        }
      };
      channel.addEventListener("message", onMessage);
      return () => channel.removeEventListener("message", onMessage);
    }
    return () => undefined;
  }, []);

  // Local persistence key changes sync this tab from other tabs even w/o BroadcastChannel.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && typeof parsed.isRegistrationOpen === "boolean") {
          setState(
            normalize({
              isRegistrationOpen: Boolean(parsed.isRegistrationOpen),
              registrationExpiresAt:
                typeof parsed.registrationExpiresAt === "number"
                  ? parsed.registrationExpiresAt
                  : null,
            })
          );
        }
      } catch {
        // Ignore malformed external writes.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const bus = broadcastRef.current;
    return () => bus?.close();
  }, []);

  const expiresInMs = useMemo(() => {
    if (!state.isRegistrationOpen || state.registrationExpiresAt === null) return 0;
    return Math.max(0, state.registrationExpiresAt - now);
  }, [state, now]);

  const remainingLabel = useMemo(() => {
    const totalSeconds = Math.floor(expiresInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }, [expiresInMs]);

  const value = useMemo<RegistrationContextValue>(
    () => ({
      isRegistrationOpen: state.isRegistrationOpen,
      registrationExpiresAt: state.registrationExpiresAt,
      expiresInMs,
      remainingLabel,
      statusLabel: state.isRegistrationOpen ? "OPEN" : "CLOSED",
      loading,
      startRegistration,
      closeRegistration,
      refresh,
    }),
    [state, expiresInMs, remainingLabel, loading, startRegistration, closeRegistration, refresh]
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export type { RegistrationContextValue, RegistrationStatus };