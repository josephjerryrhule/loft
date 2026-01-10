"use client";

import { useEffect } from "react";

export function FaviconUpdater({ faviconUrl }: { faviconUrl?: string }) {
  useEffect(() => {
    if (!faviconUrl) return;

    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());

    // Add new favicon with cache buster
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = `${faviconUrl}?v=${Date.now()}`;
    document.head.appendChild(link);

    // Also add apple touch icon
    const appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    appleLink.href = `${faviconUrl}?v=${Date.now()}`;
    document.head.appendChild(appleLink);
  }, [faviconUrl]);

  return null;
}
