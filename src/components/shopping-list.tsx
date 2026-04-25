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
  const uncheckedItems = useMemo(
    () => items.filter((item) => !checked[item.name]),
    [checked, items],
  );

  const markAll = () => {
    setChecked(Object.fromEntries(items.map((item) => [item.name, true])));
  };

  const clearAll = () => {
    setChecked({});
  };

  return (
    <section id="shopping-list" className="rounded-[24px] border border-rose-200 bg-white p-5 shadow-sm shadow-rose-100/50 sm:p-6 scroll-mt-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
            Grocery plan
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-900 sm:text-2xl">
            Shopping list for today plus the next 3 days
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Tap items as you shop. Your checkmarks stay saved on this device.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <div className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
            {remainingCount} left
          </div>
          <div className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
            {completedCount} done
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={markAll}
          className="min-h-12 rounded-2xl bg-rose-500 px-5 text-base font-semibold text-white transition hover:bg-rose-600"
        >
          Mark all bought
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-12 rounded-2xl border border-rose-200 bg-white px-5 text-base font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Clear checkmarks
        </button>
      </div>

      {uncheckedItems.length ? (
        <div className="mb-5 rounded-[20px] border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
            Still to buy next
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {uncheckedItems.slice(0, 6).map((item) => (
              <span
                key={`next-${item.name}`}
                className="rounded-2xl bg-white px-3 py-2 text-base font-medium text-stone-800"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Shopping complete
          </p>
          <p className="mt-2 text-lg font-medium text-emerald-900">
            Everything on this list has been checked off.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const isChecked = Boolean(checked[item.name]);

          return (
            <label
              key={item.name}
              className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-4 py-4 transition ${
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
                className="mt-1 h-6 w-6 rounded-lg border-stone-300 text-rose-500 focus:ring-rose-400"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-lg font-medium ${
                      isChecked ? "text-emerald-800 line-through" : "text-stone-900"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="rounded-2xl bg-white px-3 py-1 text-sm font-medium text-stone-500">
                    {item.category}
                  </span>
                </div>
                <p className="mt-1 text-base text-stone-600">
                  Buy: {item.total.join(" + ")}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  Used in: {item.recipeTitles.join(", ")}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <p className="mt-5 text-center text-lg font-semibold text-rose-600">Reset, Renew, Repeat!</p>
    </section>
  );
}
