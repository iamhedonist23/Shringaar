"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function Drawer({ open, onOpenChange, title, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay bg-plum/35 fixed inset-0 z-50 backdrop-blur-[2px]" />
        <Dialog.Content className="drawer-content border-border bg-ivory shadow-soft fixed inset-y-0 right-0 z-50 flex w-[min(92vw,420px)] flex-col border-l p-6 sm:p-8">
          <div className="border-border flex items-center justify-between border-b pb-5">
            <Dialog.Title className="font-display text-plum text-2xl">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close drawer"
              className="text-muted hover:bg-plum/5 hover:text-plum focus-visible:ring-gold rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto py-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
