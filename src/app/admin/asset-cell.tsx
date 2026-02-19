"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";

function SmallThumb({ url, label }: { url: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border bg-muted/50 text-muted-foreground hover:bg-muted"
        title={label}
      >
        <FileImage className="h-4 w-4" />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-9 w-9 shrink-0 overflow-hidden rounded border bg-muted/30 hover:opacity-90"
      title={label}
    >
      <img
        src={url}
        alt={label}
        className="h-9 w-9 object-cover"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export function AssetCell({
  socialsImageUrl,
  printImageUrl,
  emailSeparately,
  socialsImageName,
  printImageName,
}: {
  socialsImageUrl: string | null | undefined;
  printImageUrl: string | null | undefined;
  emailSeparately: boolean;
  socialsImageName?: string | null;
  printImageName?: string | null;
}) {
  const hasSocials = Boolean(socialsImageUrl);
  const hasPrint = Boolean(printImageUrl);
  const hasAny = hasSocials || hasPrint;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasSocials && <SmallThumb url={socialsImageUrl!} label="Socials" />}
      {hasPrint && <SmallThumb url={printImageUrl!} label="Print" />}
      {emailSeparately && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Emailed separately
        </span>
      )}
      {!hasAny && !emailSeparately && (
        <span className="text-muted-foreground">
          {[socialsImageName, printImageName].filter(Boolean).join(", ") || "—"}
        </span>
      )}
    </div>
  );
}
