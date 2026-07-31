"use client";

import { useState } from "react";
import { useEggRate } from "@/hooks/useEggRate";
import { Pencil, Check, X, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function EggRateWidget() {
  const { current, history, perEgg, perPatti, updateRate, loaded } = useEggRate();
  const [editing,    setEditing]    = useState(false);
  const [inputMode,  setInputMode]  = useState<"patti" | "tray">("patti");
  const [inputRate,  setInputRate]  = useState("");
  const [inputNote,  setInputNote]  = useState("");
  const [flash,      setFlash]      = useState(false);

  if (!loaded || !current) return null;

  const last3 = history.slice(-3);
  const prev  = history.length >= 2 ? history[history.length - 2] : null;
  const diff  = prev ? current.rate - prev.rate : 0;

  // Derived patti diffs for display
  const pattiDiff = diff * 12;

  function formatDay(iso: string) {
    const d   = new Date(iso);
    const now = new Date();
    const dif = Math.round((now.getTime() - d.getTime()) / 86400000);
    if (dif === 0) return "Today";
    if (dif === 1) return "Yesterday";
    return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
  }

  function handleSave() {
    const n = parseFloat(inputRate);
    if (!n || n < 1) return;
    // Convert to tray rate before saving
    const trayRate = inputMode === "patti" ? n / 12 : n;
    if (trayRate < 100 || trayRate > 10000) return;
    updateRate(trayRate, inputNote || "Manual update", "Manager");
    setEditing(false); setInputRate(""); setInputNote("");
    setFlash(true); setTimeout(() => setFlash(false), 2000);
  }

  // Preview conversions while typing
  const previewTray  = inputRate ? (inputMode === "patti" ? parseFloat(inputRate) / 12 : parseFloat(inputRate)) : 0;
  const previewPatti = inputRate ? (inputMode === "patti" ? parseFloat(inputRate) : parseFloat(inputRate) * 12) : 0;
  const previewEgg   = previewTray ? previewTray / 30 : 0;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors duration-500 ${
      flash ? "border-emerald-400/60 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-border bg-card"
    }`}>

      {/* Label */}
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Egg Rate</span>

      {!editing ? (
        <>
          {/* ── Patti rate — hero ── */}
          <div className="flex items-baseline gap-1.5 flex-1 flex-wrap">
            <span className="text-base font-black">₨{perPatti.toLocaleString()}</span>
            <span className="text-[11px] text-muted-foreground font-medium">/patti</span>

            {/* Divider */}
            <span className="text-muted-foreground/30 mx-0.5 hidden sm:inline">·</span>

            {/* Secondary rates */}
            <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
              ₨{current.rate.toLocaleString()}/tray
            </span>
            <span className="text-muted-foreground/30 mx-0.5 hidden sm:inline">·</span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
              ₨{perEgg}/egg
            </span>

            {/* Trend badge */}
            {prev && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                pattiDiff > 0
                  ? "border-emerald-400/40 text-emerald-600 dark:text-emerald-400"
                  : pattiDiff < 0
                  ? "border-red-400/40 text-red-500"
                  : "border-border text-muted-foreground"
              }`}>
                {pattiDiff > 0 ? <TrendingUp className="h-2.5 w-2.5"/>
                 : pattiDiff < 0 ? <TrendingDown className="h-2.5 w-2.5"/>
                 : <Minus className="h-2.5 w-2.5"/>}
                {pattiDiff === 0 ? "Same" : `${pattiDiff > 0 ? "+" : ""}₨${pattiDiff}/patti`}
              </span>
            )}
          </div>

          {/* Last 3 days chips */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {last3.map((h, i) => (
              <div key={i} className={`text-center px-2 py-1 rounded-lg text-[10px] border ${
                i === last3.length - 1
                  ? "border-border bg-muted/50 font-bold"
                  : "border-transparent text-muted-foreground"
              }`}>
                <p className="font-mono font-semibold">₨{(h.rate * 12).toLocaleString()}</p>
                <p className="opacity-60 text-[9px]">{formatDay(h.updatedAt)}</p>
              </div>
            ))}
          </div>

          {/* Update button */}
          <button
            onClick={() => { setEditing(true); setInputRate(String(Math.round(current.rate * 12))); setInputMode("patti"); }}
            className="flex items-center gap-1 shrink-0 text-[10px] font-semibold border border-border rounded-md px-2 py-1 hover:bg-muted transition-colors text-muted-foreground"
          >
            <Pencil className="h-2.5 w-2.5" /> Update
          </button>
        </>
      ) : (
        /* Inline edit */
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-border overflow-hidden text-[10px] font-semibold shrink-0">
            <button
              onClick={() => { setInputMode("patti"); setInputRate(inputRate ? String(Math.round(parseFloat(inputRate) * (inputMode === "tray" ? 12 : 1))) : ""); }}
              className={`px-2 py-1.5 transition-colors ${inputMode === "patti" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              /Patti
            </button>
            <button
              onClick={() => { setInputMode("tray"); setInputRate(inputRate ? String(Math.round(parseFloat(inputRate) / (inputMode === "patti" ? 12 : 1))) : ""); }}
              className={`px-2 py-1.5 transition-colors ${inputMode === "tray" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              /Tray
            </button>
          </div>

          {/* Rate input */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₨</span>
            <input
              type="number"
              value={inputRate}
              onChange={(e) => setInputRate(e.target.value)}
              placeholder={inputMode === "patti" ? "Rate/patti" : "Rate/tray"}
              autoFocus
              className="pl-6 pr-3 py-1.5 w-32 rounded-lg border border-border bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <input
            type="text"
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
            placeholder="Note (optional)"
            className="px-3 py-1.5 w-32 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Live preview */}
          {inputRate && previewPatti > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
              = ₨{previewPatti.toLocaleString()}/patti · ₨{previewTray.toFixed(0)}/tray · ₨{previewEgg.toFixed(2)}/egg
            </span>
          )}

          <div className="flex gap-1.5">
            <button onClick={handleSave} className="flex items-center gap-1 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-bold transition-colors hover:opacity-80">
              <Check className="h-3 w-3"/> Save
            </button>
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
              <X className="h-3 w-3"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
