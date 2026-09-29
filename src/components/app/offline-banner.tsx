"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CloudOff, CloudCheck } from "lucide-react";
import { flushQueue } from "@/lib/offline-queue";
import { useI18n } from "../providers";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Tells people what still works when the signal drops, and syncs on return. */
export function OfflineBanner() {
  const { t } = useI18n();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const [justSynced, setJustSynced] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  if (!online && !wasOffline) setWasOffline(true);

  useEffect(() => {
    if (!online || !wasOffline) return;
    let timer: ReturnType<typeof setTimeout>;
    flushQueue().finally(() => {
      setJustSynced(true);
      setWasOffline(false);
      timer = setTimeout(() => setJustSynced(false), 4000);
    });
    return () => clearTimeout(timer);
  }, [online, wasOffline]);

  // Try once on load too, in case answers were saved in an earlier offline visit.
  useEffect(() => {
    flushQueue();
  }, []);

  if (online && !justSynced) return null;

  return (
    <div
      role="status"
      className={`rise flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
        online ? "bg-ok-wash text-ok" : "bg-warn-wash text-ink"
      }`}
    >
      {online ? <CloudCheck className="size-5 shrink-0" aria-hidden="true" /> : <CloudOff className="size-5 shrink-0" aria-hidden="true" />}
      {online ? t.app.backOnline : t.app.offline}
    </div>
  );
}
