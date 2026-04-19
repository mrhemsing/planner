import Image from "next/image";
import { RecipeBrowser } from "@/components/recipe-browser";
import { recipeLibrary } from "@/lib/planner";

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff6fa_0%,#fff9fc_34%,#ffffff_100%)] px-4 py-5 text-stone-900 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <section className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-lg shadow-rose-100/50 sm:p-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-[24px] border border-rose-100 bg-rose-50 shadow-sm shadow-rose-100/70 sm:h-24 sm:w-24">
                <Image
                  src="/princess-planner-logo.jpg"
                  alt="Princess Planner logo"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">
                  Princess Planner Recipes
                </p>
                <p className="mt-1 text-base text-stone-600 sm:text-lg">
                  Recipe browsing only, for now
                </p>
              </div>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                A clean recipe library with just the essentials.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700 sm:text-xl sm:leading-9">
                We have temporarily stripped out planning, grocery, and extra header clutter so this can function as a straightforward recipe site.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Sections" value="3" />
              <Metric label="Recipes" value={String(recipeLibrary.length)} />
              <Metric label="Focus" value="Browse" />
            </div>
          </div>
        </section>

        <RecipeBrowser recipes={recipeLibrary} />
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4">
      <p className="text-sm uppercase tracking-[0.16em] text-rose-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">{value}</p>
    </div>
  );
}
