"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteSponsorAction } from "@/app/admin/actions";
import { useState } from "react";

export function DeleteSponsorButton({ sponsorId }: { sponsorId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Move this sponsor to archived? They will no longer appear in Active sponsors. You can still view and edit them in Archived.")) {
      return;
    }
    setIsDeleting(true);
    await deleteSponsorAction(sponsorId);
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive-foreground"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isDeleting ? "Moving…" : "Delete (mark inactive)"}
    </Button>
  );
}
