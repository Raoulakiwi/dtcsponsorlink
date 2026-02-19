"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";

export function AssetThumbnail({
  url,
  alt,
  label,
}: {
  url: string;
  alt: string;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 w-fit">
        <FileImage className="h-10 w-10 text-muted-foreground" />
        <div className="flex flex-col">
          {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
            Open file
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-fit">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md border overflow-hidden bg-muted/30 hover:opacity-90 transition-opacity"
      >
        <img
          src={url}
          alt={alt}
          className="h-20 w-20 object-cover"
          onError={() => setFailed(true)}
        />
      </a>
    </div>
  );
}
