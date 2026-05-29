import type { Metadata } from "next";
import { FeatureLab } from "@/components/feature-lab/feature-lab";
import { planningLabRecipes } from "@/lib/planning-lab-recipes";

export const metadata: Metadata = {
  title: "Planning Lab",
  description: "Staged planning, filtering, fridge matching, and cook mode prototypes.",
};

export default function FeatureLabPage() {
  return <FeatureLab recipes={planningLabRecipes} />;
}
