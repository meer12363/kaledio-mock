"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./ui";
import { useToast } from "./Toast";
import { IconClapper } from "./icons";

const MEDIA = ["Feature Film", "OTT Series", "TV Series", "Ad Film", "Music Video", "Theatre", "Short Film"];

export function CreateCastingModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [medium, setMedium] = useState(MEDIA[0]);
  const [location, setLocation] = useState("");
  const [comp, setComp] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("kaledio:create-call", onOpen);
    return () => window.removeEventListener("kaledio:create-call", onOpen);
  }, []);

  const reset = () => {
    setTitle("");
    setLocation("");
    setComp("");
    setDesc("");
    setMedium(MEDIA[0]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setOpen(false);
    reset();
    toast("Casting call posted — talent will start applying 🎬", "accent");
  };

  const field =
    "w-full rounded-xl border border-line-strong bg-paper px-4 py-2.5 text-[15px] placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="ccm-title">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 [background:var(--grad-hero)] grad-animate opacity-95" />
        <div className="relative px-6 pb-6 pt-7 sm:px-7">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-paper/95 text-brand-600 shadow-lift">
            <IconClapper size={22} />
          </span>
          <h2 id="ccm-title" className="mt-3 font-display text-2xl font-semibold tracking-tight text-white">
            Post a casting call
          </h2>
          <p className="mt-1 text-[13px] text-white/85">Reach thousands of verified talent in minutes.</p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Role / project title — e.g. Female lead, 28–38"
              className={field}
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={medium} onChange={(e) => setMedium(e.target.value)} className={field}>
                {MEDIA.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={field} />
            </div>
            <input value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Compensation — e.g. Paid, ₹12L" className={field} />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Describe the role, the brief, and how to apply…"
              className={`${field} resize-none`}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-500 hover:bg-canvas">
                Cancel
              </button>
              <Button type="submit" variant="accent" disabled={!title.trim()}>
                Post the call
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
