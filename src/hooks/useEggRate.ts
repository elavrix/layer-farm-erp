"use client";

import { useState, useEffect } from "react";

export interface RateEntry {
  rate: number;       // per tray
  note: string;
  updatedBy: string;
  updatedAt: string;  // ISO string
}

const STORAGE_KEY = "layerfarm_egg_rate";

const DEFAULT_HISTORY: RateEntry[] = [
  { rate: 1020, note: "Market open",     updatedBy: "Ali Hassan",  updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { rate: 1035, note: "Rate increased",  updatedBy: "Usman Khan",  updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { rate: 1050, note: "Current market",  updatedBy: "Ali Hassan",  updatedAt: new Date().toISOString() },
];

export function useEggRate() {
  const [history, setHistory] = useState<RateEntry[]>(DEFAULT_HISTORY);
  const [loaded,  setLoaded]  = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const current = history[history.length - 1];

  function updateRate(rate: number, note: string, updatedBy: string) {
    const entry: RateEntry = { rate, note, updatedBy, updatedAt: new Date().toISOString() };
    const next = [...history.slice(-9), entry]; // keep last 10
    setHistory(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  return {
    current,
    history,
    loaded,
    updateRate,
    perEgg:   current ? +(current.rate / 30).toFixed(2) : 0,
    perPatti: current ? current.rate * 12              : 0,
  };
}
