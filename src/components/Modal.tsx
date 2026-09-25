"use client";

import { useEffect } from "react";
import { IconX } from "./icons";

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        style={{ animation: "backdrop-in 0.2s ease-out both" }}
      />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-t-3xl border border-line bg-paper shadow-pop sm:rounded-3xl`}
        style={{ animation: "modal-in 0.32s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-paper/80 text-ink-400 backdrop-blur transition-colors hover:bg-canvas hover:text-ink-700"
        >
          <IconX size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
