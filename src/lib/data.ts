import { Gem, Crown, Star, Trophy } from "lucide-react";
import type { SponsorshipTier } from "./types";

export const sponsorshipTiers: SponsorshipTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    price: 250,
    icon: Trophy,
    benefits: ["Logo on our website", "Social media thank you post"],
  },
  {
    id: "silver",
    name: "Silver",
    price: 500,
    icon: Star,
    benefits: [
      "All Bronze benefits",
      "Logo on club newsletters",
      "Small banner at the club",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 1000,
    icon: Crown,
    benefits: [
      "All Silver benefits",
      "Medium banner at the club",
      "Mention at club events",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 2000,
    icon: Gem,
    benefits: [
      "All Gold benefits",
      "Large banner at main court",
      "Event sponsorship opportunity",
    ],
  },
];
