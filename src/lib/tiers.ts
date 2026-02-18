/** Tier options for server/admin use (no icons). Matches lib/data.ts. */
export const tierOptions = [
  { id: "naming-rights", name: "Naming Rights", price: 5000 },
  { id: "platinum", name: "Platinum", price: 2000 },
  { id: "gold", name: "Gold", price: 1000 },
  { id: "silver", name: "Silver", price: 500 },
  { id: "bronze", name: "Bronze", price: 300 },
] as const;

/** Admin only: tier options plus "Custom amount" for manual sponsorship entry. */
export const tierOptionsWithCustom = [
  ...tierOptions,
  { id: "custom", name: "Custom amount", price: 0 },
] as const;

export type TierId = (typeof tierOptions)[number]["id"];
