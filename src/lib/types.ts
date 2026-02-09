import type { LucideIcon } from "lucide-react";

export type SponsorshipTier = {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  icon: LucideIcon;
};
