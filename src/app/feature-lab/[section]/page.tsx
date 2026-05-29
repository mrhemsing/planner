import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureLab } from "@/components/feature-lab/feature-lab";
import type { FeatureTabId } from "@/components/feature-lab/feature-lab";
import { planningLabRecipes } from "@/lib/planning-lab-recipes";

const sectionMetadata: Record<string, Metadata> = {
  "weekly-planner": {
    title: "Weekly Planner | Planning Lab",
    description: "Plan a five-day dinner week and generate a grouped shopping list.",
  },
  week: {
    title: "Weekly Planner | Planning Lab",
    description: "Plan a five-day dinner week and generate a grouped shopping list.",
  },
  "smart-filters": {
    title: "Smart Filters | Planning Lab",
    description: "Combine dinner filters, search recipes, and hide ingredients.",
  },
  filters: {
    title: "Smart Filters | Planning Lab",
    description: "Combine dinner filters, search recipes, and hide ingredients.",
  },
  "fridge-ai": {
    title: "Fridge AI | Planning Lab",
    description: "Match dinner recipes to ingredients already in the kitchen.",
  },
  tonight: {
    title: "Fridge AI | Planning Lab",
    description: "Match dinner recipes to ingredients already in the kitchen.",
  },
};

type FeatureLabSectionPageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({ params }: FeatureLabSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  return sectionMetadata[section] ?? {};
}

export default async function FeatureLabSectionPage({ params }: FeatureLabSectionPageProps) {
  const { section } = await params;
  const initialTab = getInitialTab(section);

  if (!initialTab) notFound();

  return <FeatureLab recipes={planningLabRecipes} initialTab={initialTab} />;
}

function getInitialTab(section: string): FeatureTabId | null {
  if (section === "weekly-planner") return "week";
  if (section === "week") return "week";
  if (section === "smart-filters") return "filters";
  if (section === "filters") return "filters";
  if (section === "fridge-ai") return "fridge";
  if (section === "tonight") return "fridge";
  return null;
}
