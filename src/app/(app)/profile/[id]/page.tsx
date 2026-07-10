"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MessageButton, ProfileView, type ProfileData } from "@/components/ProfileView";
import { ConnectButton } from "@/components/ConnectButton";
import { IconArrowLeft } from "@/components/icons";
import { Card, Skeleton } from "@/components/ui";
import { gql, PERSON_FIELDS } from "@/lib/gql";
import type { Person } from "@/lib/types";

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    gql<{ person: Person | null }>(
      `${PERSON_FIELDS}
      query($id: ID!) { person(id: $id) { ...PersonFields } }`,
      { id }
    )
      .then((d) => setPerson(d.person))
      .catch(() => setPerson(null));
  }, [id]);

  const message = () => {
    if (!person) return;
    gql<{ startConversation: { id: string } }>(
      `mutation($personId: ID!) { startConversation(personId: $personId) { id } }`,
      { personId: person.id }
    ).then((d) => router.push(`/messages?c=${d.startConversation.id}`));
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard unavailable — feedback still shown
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (person === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="overflow-hidden">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-3 p-7">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </Card>
        <Card className="space-y-3 p-7">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </Card>
      </div>
    );
  }

  if (person === null) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="font-display text-2xl text-ink-900">This profile isn&apos;t in the credits.</p>
        <p className="mt-2 text-sm text-ink-500">It may have been removed, or the link is off by a frame.</p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to search
        </Link>
      </div>
    );
  }

  const profile: ProfileData = { ...person };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/search"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
      >
        <IconArrowLeft size={15} /> Back to search
      </Link>
      <ProfileView
        profile={profile}
        avatarSrc={person.avatarUrl || undefined}
        actions={
          <>
            <button
              onClick={share}
              className="rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {copied ? "Link copied ✓" : "Share"}
            </button>
            <ConnectButton personId={person.id} status={person.connectionStatus ?? "none"} />
            <MessageButton onClick={message} name={person.name} />
          </>
        }
      />
    </div>
  );
}
