"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconCheck, IconX } from "./icons";

type ToastTone = "success" | "info" | "accent";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  leaving?: boolean;
}

interface ToastCtx {
  toast: (message: string, tone?: ToastTone) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const TONE_STYLES: Record<ToastTone, { bar: string; icon: React.ReactNode }> = {
  success: { bar: "bg-go", icon: <IconCheck size={15} /> },
  info: { bar: "bg-brand-500", icon: <IconCheck size={15} /> },
  accent: { bar: "[background:var(--grad-spotlight)]", icon: <span className="text-sm">✨</span> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 220);
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++seq.current;
      setToasts((t) => [...t, { id, message, tone }]);
      window.setTimeout(() => remove(id), 3400);
    },
    [remove]
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => {
          const s = TONE_STYLES[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-line bg-paper/95 py-3 pl-3 pr-2.5 shadow-pop backdrop-blur"
              style={{ animation: `${t.leaving ? "toast-out" : "toast-in"} 0.24s cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${s.bar}`}>
                {s.icon}
              </span>
              <p className="min-w-0 flex-1 text-[13.5px] font-medium text-ink-800">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-canvas hover:text-ink-700"
              >
                <IconX size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  // No-op fallback so components using toasts never crash outside the provider.
  return ctx ?? { toast: () => {} };
}
