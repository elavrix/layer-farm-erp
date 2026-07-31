"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface RateEntry {
  rate: number;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export function useEggRate() {
  const [history, setHistory] = useState<RateEntry[]>([]);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("egg_rates")
      .select("rate, note, updated_by, created_at")
      .order("created_at", { ascending: true })
      .limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHistory(data.map(r => ({
            rate:      Number(r.rate),
            note:      r.note || "",
            updatedBy: r.updated_by || "Manager",
            updatedAt: r.created_at,
          })));
        } else {
          // fallback seed if table is empty
          setHistory([{ rate: 1050, note: "Current market", updatedBy: "Manager", updatedAt: new Date().toISOString() }]);
        }
        setLoaded(true);
      });
  }, []);

  const current = history[history.length - 1];

  async function updateRate(rate: number, note: string, updatedBy: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("egg_rates")
      .insert({ rate, note, updated_by: updatedBy })
      .select()
      .single();

    if (!error && data) {
      const entry: RateEntry = {
        rate:      Number(data.rate),
        note:      data.note || "",
        updatedBy: data.updated_by || updatedBy,
        updatedAt: data.created_at,
      };
      setHistory(prev => [...prev.slice(-9), entry]);
    }
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
