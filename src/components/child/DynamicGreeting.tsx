"use client";

import React, { useEffect, useState } from "react";

export function DynamicGreeting() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning!");
    else if (hour < 17) setGreeting("Good Afternoon!");
    else setGreeting("Good Evening!");
  }, []);

  // Return a placeholder or the same initial state as server to avoid layout shift if possible
  // but since we want to avoid hydration mismatch, returning empty then setting is safest.
  // Or we can return "Good Morning!" as default if we assume that's most common.
  return (
    <h2 className="text-lg font-black text-[#E87154] uppercase tracking-[0.25em] font-quicksand min-h-[1.75rem]">
      {greeting}
    </h2>
  );
}
