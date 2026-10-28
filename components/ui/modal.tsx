"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export function Modal({ open, onOpenChange, title, description, className, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay bg-plum/35 fixed inset-0 z-50 backdrop-blur-[2px]" />
        <Dialog.Content className={cn("modal-content rounded-card border-border bg-ivory shadow-soft fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 border p-6 sm:p-8", className)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-plum text-2xl">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-muted mt-1 text-sm">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close dialog"
              className="text-muted hover:bg-plum/5 hover:text-plum focus-visible:ring-gold rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>
          <div className="mt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
