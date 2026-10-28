"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastMessage = { id: number; message: string };
type ToastContextValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setMessages((current) => [...current, { id, message }]);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const timers = messages.map((message) =>
      window.setTimeout(() => dismiss(message.id), 3600),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [dismiss, messages]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions removals"
        className="fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-control border-success/20 text-ink shadow-soft flex items-center gap-3 border bg-white p-3.5 text-sm"
              role="status"
            >
              <Check aria-hidden="true" className="text-success size-4 shrink-0" />
              <span className="flex-1">{message.message}</span>
              <Button
                aria-label="Dismiss notification"
                className="size-8 min-h-8"
                onClick={() => dismiss(message.id)}
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
