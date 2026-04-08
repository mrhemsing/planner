"use client";

import { useEffect, useMemo, useState } from "react";
import type { GroceryItem } from "@/lib/planner";

const STORAGE_KEY = "princess-planner-shopping-list";

export function ShoppingList({ items }: { items: GroceryItem[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChecked(JSON.parse(stored) as Record<string, boolean>);
      }
    } catch {
      // ignore storage read issues
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked, hydrated]);

  const remainingCount = useMemo(
    () => items.filter((item) => !checked[item.name]).length,
    [checked, items],
  );

  const completedCount = items.length - remainingCount;

  return (
    <section className="rounded-[28px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/50 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
            Grocery plan
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-900 sm:text-2xl">
            Shopping list for this 5-day block
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Tap items as you shop. Your checkmarks stay saved on this device.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
            {remainingCount} left
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
            {completedCount} done
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isChecked = Boolean(checked[item.name]);

          return (
            <label
              key={item.name}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                isChecked
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-stone-200 bg-stone-50/70 hover:border-rose-200 hover:bg-rose-50/60"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() =>
                  setChecked((current) => ({
                    ...current,
                    [item.name]: !current[item.name],
                  }))
                }
                className="mt-1.5 h-5 w-5 rounded border-stone-300 text-rose-500 focus:ring-rose-400"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-base font-medium ${
                      isChecked ? "text-emerald-800 line-through" : "text-stone-900"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-500">
                    {item.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  Buy: {item.total.join(" + ")}
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Used in: {item.recipeTitles.join(", ")}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
