"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export function VerificationTimestamp() {
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // This will run on the client, using the client's local timezone
    setTimestamp(format(new Date(), "MMM dd, yyyy · HH:mm:ss"));
  }, []);

  if (!timestamp) {
    // Return a placeholder with the same height to avoid layout shift
    return <div className="h-[1rem] py-1" />;
  }

  return (
    <p className="text-slate-900 text-xs font-bold">
      {timestamp}
    </p>
  );
}
