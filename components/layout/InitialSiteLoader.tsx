"use client";

import { useEffect, useState } from "react";
import { VoltJoLoadingScreen } from "@/components/layout/VoltJoLoadingScreen";

const INITIAL_LOADER_KEY = "voltjo:initial-loader:seen";
const INITIAL_LOADER_COMPLETE_EVENT = "voltjo:initial-loader:complete";

function hasSeenInitialLoader() {
  try {
    const status = window.sessionStorage.getItem(INITIAL_LOADER_KEY);
    return status === "true" || status === "complete";
  } catch {
    return false;
  }
}

function setInitialLoaderStatus(status: "running" | "complete") {
  try {
    window.sessionStorage.setItem(INITIAL_LOADER_KEY, status);
  } catch {
    // If storage is unavailable, keep the visual experience for this page load only.
  }
}

function announceInitialLoaderComplete() {
  document.documentElement.dataset.voltjoInitialLoader = "complete";
  window.dispatchEvent(new Event(INITIAL_LOADER_COMPLETE_EVENT));
}

export function InitialSiteLoader() {
  const [shouldRender, setShouldRender] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (hasSeenInitialLoader()) {
      setShouldRender(false);
      return undefined;
    }

    setInitialLoaderStatus("running");

    // Hold the splash briefly, then play the 920ms exit animation. The remove
    // delay stays >920ms after exit starts so the animation can finish cleanly.
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, 700);

    const removeTimer = window.setTimeout(() => {
      setInitialLoaderStatus("complete");
      announceInitialLoaderComplete();
      setShouldRender(false);
    }, 1640);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] bg-white ${
        isExiting ? "voltjo-initial-loader-exit" : "voltjo-initial-loader-enter"
      }`}
    >
      <VoltJoLoadingScreen />
    </div>
  );
}
