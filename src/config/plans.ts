export type PlanId =
  | "sandbox"
  | "developer"
  | "growth"
  | "business"
  | "enterprise";

export type PlanAvailability = "available" | "validation" | "contract";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyOperations: number | null;
  retentionDays: number | null;
  monthlyPriceUsd: number | null;
  overageUsd: number | null;
  projects: number | null;
  selfService: boolean;
  availability: PlanAvailability;
};

const plans: Record<PlanId, PlanDefinition> = {
  sandbox: {
    id: "sandbox",
    name: "Sandbox",
    monthlyOperations: 500,
    retentionDays: 7,
    monthlyPriceUsd: 0,
    overageUsd: null,
    projects: 1,
    selfService: true,
    availability: "available",
  },
  developer: {
    id: "developer",
    name: "Developer",
    monthlyOperations: 10_000,
    retentionDays: 30,
    monthlyPriceUsd: 99,
    overageUsd: 0.01,
    projects: 1,
    selfService: false,
    availability: "validation",
  },
  growth: {
    id: "growth",
    name: "Growth",
    monthlyOperations: 100_000,
    retentionDays: 90,
    monthlyPriceUsd: 499,
    overageUsd: 0.005,
    projects: 5,
    selfService: false,
    availability: "validation",
  },
  business: {
    id: "business",
    name: "Business",
    monthlyOperations: 500_000,
    retentionDays: null,
    monthlyPriceUsd: 2_500,
    overageUsd: 0.003,
    projects: null,
    selfService: false,
    availability: "validation",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise / OEM",
    monthlyOperations: null,
    retentionDays: null,
    monthlyPriceUsd: 5_000,
    overageUsd: null,
    projects: null,
    selfService: false,
    availability: "contract",
  },
};

export function getPlan(id: PlanId): PlanDefinition {
  return plans[id];
}

export function normalizePlanId(value: unknown): PlanId {
  if (typeof value === "string" && value in plans) return value as PlanId;
  return "sandbox";
}

export function listPublicPlans(): PlanDefinition[] {
  return Object.values(plans);
}
