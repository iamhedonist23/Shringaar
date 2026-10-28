"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { label: string; content: React.ReactNode };

export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(0);
  const activeTab = tabs[active];
  const panelId = `tab-panel-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <div
        aria-label={label}
        className="border-border flex gap-1 border-b"
        role="tablist"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            id={`${panelId}-${index}`}
            aria-controls={panelId}
            aria-selected={active === index}
            className={cn(
              "focus-visible:ring-gold min-h-11 border-b-2 px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2",
              active === index
                ? "border-gold text-plum"
                : "text-muted hover:text-plum border-transparent",
            )}
            onClick={() => setActive(index)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={panelId}
        aria-labelledby={`${panelId}-${active}`}
        className="text-muted py-4 text-sm leading-6"
        role="tabpanel"
        tabIndex={0}
      >
        {activeTab.content}
      </div>
    </div>
  );
}
