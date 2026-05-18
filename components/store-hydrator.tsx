"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function StoreHydrator() {
  const hydrateFromServer = useStore((state) => state.hydrateFromServer);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  return null;
}
