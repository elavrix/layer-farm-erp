"use client";

import { useState, useEffect } from "react";
import { Egg } from "lucide-react";

interface EggQuantity {
  pattis: number;
  trays: number;
  loose: number;
}

interface EggQuantityInputProps {
  label?: string;
  value?: EggQuantity;
  onChange?: (value: EggQuantity & { totalEggs: number; totalTrays: number }) => void;
}

const EGGS_PER_TRAY = 30;
const TRAYS_PER_PATTI = 12;
const EGGS_PER_PATTI = EGGS_PER_TRAY * TRAYS_PER_PATTI; // 360

function calcTotal(q: EggQuantity) {
  const totalEggs =
    q.pattis * EGGS_PER_PATTI +
    q.trays  * EGGS_PER_TRAY  +
    q.loose;
  const totalTrays = totalEggs / EGGS_PER_TRAY;
  return { totalEggs, totalTrays };
}

export function EggQuantityInput({ label = "Egg Quantity", value, onChange }: EggQuantityInputProps) {
  const [qty, setQty] = useState<EggQuantity>(value ?? { pattis: 0, trays: 0, loose: 0 });

  const { totalEggs, totalTrays } = calcTotal(qty);

  useEffect(() => {
    onChange?.({ ...qty, ...calcTotal(qty) });
  }, [qty]);

  const update = (field: keyof EggQuantity, raw: string) => {
    const n = Math.max(0, parseInt(raw) || 0);
    setQty((prev) => ({ ...prev, [field]: n }));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Egg className="h-3.5 w-3.5 text-yellow-500" />
          {label}
        </label>
      )}

      {/* Three input fields */}
      <div className="flex gap-2">
        {/* Pattis */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              min={0}
              value={qty.pattis || ""}
              onChange={(e) => update("pattis", e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-input bg-background px-3 pt-5 pb-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Patti
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-center">= 12 trays</p>
        </div>

        <div className="flex items-center pt-2 text-muted-foreground font-bold text-lg">+</div>

        {/* Trays */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              min={0}
              value={qty.trays || ""}
              onChange={(e) => update("trays", e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-input bg-background px-3 pt-5 pb-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Tray
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-center">= 30 eggs</p>
        </div>

        <div className="flex items-center pt-2 text-muted-foreground font-bold text-lg">+</div>

        {/* Loose eggs */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              min={0}
              value={qty.loose || ""}
              onChange={(e) => update("loose", e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-input bg-background px-3 pt-5 pb-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Loose
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-center">individual</p>
        </div>
      </div>

      {/* Live total */}
      {totalEggs > 0 && (
        <div className="flex items-center justify-between rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Egg className="h-3.5 w-3.5 text-yellow-500" />
            <span className="font-semibold text-yellow-400">
              {qty.pattis > 0 && <span>{qty.pattis} patti{qty.pattis > 1 ? "s" : ""} </span>}
              {qty.trays > 0  && <span>{qty.trays} tray{qty.trays > 1 ? "s" : ""} </span>}
              {qty.loose > 0  && <span>{qty.loose} loose </span>}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-yellow-400">{totalEggs.toLocaleString()} eggs</p>
            <p className="text-[10px] text-muted-foreground">{totalTrays.toFixed(1)} trays total</p>
          </div>
        </div>
      )}
    </div>
  );
}
