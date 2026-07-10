"use client";

import { useState } from "react";
import { gql } from "@/lib/gql";
import { IconCheck, IconUsers } from "./icons";
import type { ConnectionStatus } from "@/lib/types";

/** Connect / pending / connected button — independent of messaging. */
export function ConnectButton({
  personId,
  status,
  compact = false,
}: {
  personId: string;
  status: ConnectionStatus;
  compact?: boolean;
}) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);

  const send = () => {
    setBusy(true);
    setCurrent("pending_sent");
    gql(`mutation($personId: ID!) { sendConnectionRequest(personId: $personId) }`, { personId })
      .catch(() => setCurrent(status))
      .finally(() => setBusy(false));
  };

  const base = compact
    ? "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors"
    : "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors";

  if (current === "connected") {
    return (
      <span className={`${base} bg-go-soft text-go`}>
        <IconCheck size={compact ? 13 : 15} /> Connected
      </span>
    );
  }
  if (current === "pending_sent") {
    return (
      <span className={`${base} border border-line-strong text-ink-400`}>
        Request sent
      </span>
    );
  }
  if (current === "pending_received") {
    return (
      <span className={`${base} bg-brand-50 text-brand-700`}>
        Respond in requests
      </span>
    );
  }
  return (
    <button
      onClick={send}
      disabled={busy}
      className={`${base} border border-line-strong text-ink-700 hover:border-brand-300 hover:text-brand-700 disabled:opacity-60`}
    >
      <IconUsers size={compact ? 13 : 15} /> Connect
    </button>
  );
}
