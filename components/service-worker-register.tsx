"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Dev serves changing files under fixed names, which an offline cache
    // would pin to stale copies. Only the production build gets a worker;
    // in dev, remove any worker and caches left over from a production run.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      caches?.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    // When an updated worker takes over a page that an older worker served,
    // that page may be a stale cached copy. Reload once so returning
    // visitors always land on the current version. First visits have no
    // previous controller, so they never reload.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // offline caching is a nice-to-have — the app must still work without it
    });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
