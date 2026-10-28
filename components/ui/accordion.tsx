"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

type AccordionItem = { title: string; content: React.ReactNode };

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-border border-border divide-y border-y">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `accordion-panel-${index}`;
        return (
          <div key={item.title}>
            <h3>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="text-plum focus-visible:ring-gold flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2"
                onClick={() => setOpen(isOpen ? null : index)}
                type="button"
              >
                {item.title}
                <span aria-hidden="true" className="relative size-4 shrink-0">
                  {isOpen ? (
                    <Minus className="absolute inset-0 size-4 transition-transform duration-200" />
                  ) : (
                    <Plus className="absolute inset-0 size-4 transition-transform duration-200" />
                  )}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              className="grid transition-[grid-template-rows] duration-200"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="text-muted pb-4 text-sm leading-6">{item.content}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
