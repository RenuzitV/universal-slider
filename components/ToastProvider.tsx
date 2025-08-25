"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "../styles/toast.module.css";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; message: string; ttl: number };

type ToastCtx = {
  toast: {
    success: (msg: string, ttl?: number) => void;
    error: (msg: string, ttl?: number) => void;
    info: (msg: string, ttl?: number) => void;
  };
};

const Ctx = createContext<ToastCtx | null>(null);
const newId = () => (crypto?.randomUUID?.() ?? `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const push = useCallback((type: ToastType, message: string, ttl = 2600) => {
    const id = newId();
    setToasts((ts) => [...ts, { id, type, message, ttl }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), ttl);
  }, []);

  const ctx = useMemo<ToastCtx>(() => ({
    toast: {
      success: (m, ttl) => push("success", m, ttl),
      error:   (m, ttl) => push("error", m, ttl),
      info:    (m, ttl) => push("info", m, ttl),
    }
  }), [push]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {mounted && createPortal(
        <div className={styles.viewport}>
          {toasts.map(t => (
            <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
              <span className={styles.icon}>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
              <span className={styles.msg}>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return v.toast;
}
