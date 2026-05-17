"use client";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStage =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "compressing" }
  | { kind: "rendering" }
  | { kind: "saving" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const STAGE_ORDER: Array<{ key: UploadStage["kind"]; label: string }> = [
  { key: "uploading", label: "Uploading source PDF" },
  { key: "compressing", label: "Compressing" },
  { key: "rendering", label: "Rendering pages" },
  { key: "saving", label: "Saving manifest" },
];

function rank(stage: UploadStage): number {
  if (stage.kind === "idle") return -1;
  if (stage.kind === "error") return 999;
  if (stage.kind === "done") return STAGE_ORDER.length;
  return STAGE_ORDER.findIndex((s) => s.key === stage.kind);
}

export function UploadProgress({ stage }: { stage: UploadStage }) {
  if (stage.kind === "idle") return null;
  const current = rank(stage);

  return (
    <div className="space-y-2">
      {STAGE_ORDER.map((s, idx) => {
        const isDone = idx < current || stage.kind === "done";
        const isActive = idx === current && stage.kind !== "done" && stage.kind !== "error";
        return (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            {stage.kind === "error" && idx === current ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : isDone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : isActive ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#E87154]" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
            )}
            <span
              className={cn(
                "font-medium",
                isDone && "text-slate-700",
                isActive && "text-slate-900 font-bold",
                !isDone && !isActive && "text-slate-400"
              )}
            >
              {s.label}
            </span>
          </div>
        );
      })}
      {stage.kind === "error" && (
        <p className="text-xs text-red-600 font-medium pt-2">{stage.message}</p>
      )}
      {stage.kind === "done" && (
        <p className="text-xs text-emerald-600 font-bold pt-2">All done.</p>
      )}
    </div>
  );
}
