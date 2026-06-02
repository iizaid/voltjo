"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, LocateFixed, MapPinned, Navigation, X } from "lucide-react";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  flyToLocation,
  useMap,
} from "@/components/ui/mapcn-marker-popup";
import type { ChargingLocation } from "@/lib/vehicles/types";

type Props = {
  locations: ChargingLocation[];
  isAuthenticated: boolean;
};

const jordanCenter = {
  longitude: 35.9106,
  latitude: 31.9539,
  zoom: 7,
};

const DISMISS_KEY = "voltjo_charging_map_location_prompt_dismissed";

type UserLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};

function hasCoordinates(location: ChargingLocation) {
  return typeof location.latitude === "number" && typeof location.longitude === "number";
}

function buildDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

function saveDismissal() {
  try {
    localStorage.setItem(
      DISMISS_KEY,
      JSON.stringify({ dismissedAt: new Date().toISOString() }),
    );
  } catch {
    // ignore
  }
}

function shouldShowPromptInitially() {
  try {
    return !localStorage.getItem(DISMISS_KEY);
  } catch {
    return true;
  }
}

function LocateOverlayButton({
  onActivate,
  disabled = false,
}: {
  onActivate: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      disabled={disabled}
      className="absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] shadow-[0_8px_22px_rgba(13,13,13,0.08)] transition hover:bg-[var(--voltjo-bg-soft)] disabled:cursor-wait disabled:bg-[var(--voltjo-bg-soft)]"
      aria-label="تحديد موقعي"
    >
      <Crosshair className="size-4" />
    </button>
  );
}

function MapViewportManager({
  locations,
  userLocation,
}: {
  locations: ChargingLocation[];
  userLocation: UserLocation | null;
}) {
  const { map, isLoaded } = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (userLocation) {
      flyToLocation(map, [userLocation.longitude, userLocation.latitude], 13);
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const withCoordinates = locations.filter(hasCoordinates);
    if (!withCoordinates.length) {
      map.jumpTo({
        center: [jordanCenter.longitude, jordanCenter.latitude],
        zoom: jordanCenter.zoom,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    withCoordinates.forEach((location) => {
      bounds.extend([location.longitude as number, location.latitude as number]);
    });

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 9.8,
      duration: 0,
    });
  }, [isLoaded, locations, map, userLocation]);

  return null;
}

export function ChargingMapClient({ locations, isAuthenticated }: Props) {
  const [promptVisible, setPromptVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [saveLocation, setSaveLocation] = useState(false);
  const [transientNotice, setTransientNotice] = useState<string | null>(null);

  const mappedLocations = useMemo(
    () => locations.filter(hasCoordinates),
    [locations],
  );

  useEffect(() => {
    setPromptVisible(shouldShowPromptInitially());
  }, []);

  useEffect(() => {
    if (!transientNotice) return;
    const timer = window.setTimeout(() => setTransientNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [transientNotice]);

  const openPrompt = () => {
    setGeoError(null);
    setPromptVisible(true);
  };

  const persistLocationIfNeeded = async (location: UserLocation) => {
    if (!saveLocation) return;

    if (!isAuthenticated) {
      setTransientNotice("يمكنك استخدام الموقع الآن، ولحفظه لاحقًا سجّل الدخول أولًا.");
      return;
    }

    try {
      const response = await fetch("/api/account/location-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: location.accuracyMeters,
          consent: true,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setTransientNotice(data?.error || "تعذر حفظ الموقع الآن. يمكنك متابعة الاستخدام بدون حفظ.");
        return;
      }

      setTransientNotice("تم حفظ موقعك لهذا الحساب بعد موافقتك.");
    } catch {
      setTransientNotice("تعذر حفظ الموقع الآن. يمكنك متابعة الاستخدام بدون حفظ.");
    }
  };

  const closePrompt = () => {
    saveDismissal();
    setPromptVisible(false);
  };

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("المتصفح الحالي لا يدعم تحديد الموقع الجغرافي.");
      setPromptVisible(true);
      return;
    }

    setRequestingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Number.isFinite(position.coords.accuracy)
            ? Math.round(position.coords.accuracy)
            : null,
        };

        setUserLocation(location);
        setRequestingLocation(false);
        closePrompt();
        await persistLocationIfNeeded(location);
      },
      () => {
        setGeoError(
          "لم نتمكن من الوصول إلى موقعك. يمكنك السماح بالصلاحية من إعدادات المتصفح أو المتابعة بدون تحديد الموقع.",
        );
        setRequestingLocation(false);
        setPromptVisible(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  };

  const handleLocateControl = () => {
    if (requestingLocation) return;

    if (userLocation) {
      requestLocation();
      return;
    }

    openPrompt();
  };

  return (
    <div className="relative" dir="rtl">
      {transientNotice ? (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-[var(--voltjo-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--voltjo-black)] shadow-[0_12px_30px_rgba(13,13,13,0.08)]">
          {transientNotice}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[28px] border border-[var(--voltjo-border)] bg-white">
        <LocateOverlayButton
          onActivate={handleLocateControl}
          disabled={requestingLocation}
        />

        <div className="relative h-[640px] min-h-[640px] md:h-[740px] md:min-h-[740px]">
          <Map
            center={[jordanCenter.longitude, jordanCenter.latitude]}
            zoom={jordanCenter.zoom}
            className="h-full w-full"
          >
            <MapControls showNavigation showGeolocate={false} />
            <MapViewportManager locations={mappedLocations} userLocation={userLocation} />

            {mappedLocations.map((location) => (
              <MapMarker
                key={location.id}
                longitude={location.longitude as number}
                latitude={location.latitude as number}
              >
                <MarkerContent>
                  <div className="relative">
                    <div className="size-5 rounded-full border-2 border-white bg-[var(--voltjo-orange)] shadow-[0_8px_18px_rgba(255,106,0,0.26)]" />
                    <MarkerLabel position="bottom">
                      {location.nameAr || location.city || "نقطة شحن"}
                    </MarkerLabel>
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="space-y-4 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            location.isVerified
                              ? "bg-[rgba(17,164,80,0.08)] text-[#118550]"
                              : "bg-[rgba(13,13,13,0.06)] text-[var(--voltjo-muted)]"
                          }`}
                        >
                          {location.isVerified ? "موثق" : "قيد التحقق"}
                        </span>
                        <span className="text-xs font-bold text-[var(--voltjo-muted)]">
                          {location.city || "الأردن"}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-black text-[var(--voltjo-black)]">
                          {location.nameAr}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--voltjo-muted)]">
                          {[location.city, location.area].filter(Boolean).join(" - ") || "الموقع داخل الأردن"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-[16px] border border-[var(--voltjo-border)] bg-[#FBFBF9] p-3 text-sm font-semibold text-[var(--voltjo-black)]">
                      <p>
                        <span className="text-[var(--voltjo-muted)]">المنافذ:</span>{" "}
                        {location.plugTypes.length ? location.plugTypes.join("، ") : "غير محدد"}
                      </p>
                      <p>
                        <span className="text-[var(--voltjo-muted)]">القدرة:</span>{" "}
                        {typeof location.powerKw === "number" ? `${location.powerKw} kW` : "غير محددة"}
                      </p>
                      {location.notesAr ? (
                        <p className="leading-7 text-[var(--voltjo-muted)]">{location.notesAr}</p>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={buildDirectionsUrl(location.latitude as number, location.longitude as number)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--voltjo-black)] px-4 text-sm font-black text-white transition hover:bg-[#1f1f1f]"
                      >
                        <Navigation className="size-4" />
                        <span>الاتجاهات</span>
                      </a>
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}

            {userLocation ? (
              <MapMarker
                longitude={userLocation.longitude}
                latitude={userLocation.latitude}
              >
                <MarkerContent>
                  <div className="relative">
                    <div className="size-5 rounded-full border-2 border-white bg-[#111827] shadow-[0_8px_18px_rgba(17,24,39,0.24)]" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-[#111827]/30" />
                    <MarkerLabel position="top">موقعك الحالي</MarkerLabel>
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center gap-2 text-[var(--voltjo-black)]">
                      <MapPinned className="size-4 text-[var(--voltjo-orange)]" />
                      <p className="text-base font-black">موقعك الحالي</p>
                    </div>
                    <p className="text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                      يُستخدم هذا الموقع داخل المتصفح فقط ما لم تختر حفظه لهذا الحساب.
                    </p>
                    {typeof userLocation.accuracyMeters === "number" ? (
                      <p className="text-sm font-semibold text-[var(--voltjo-muted)]">
                        دقة تقريبية: {userLocation.accuracyMeters} متر
                      </p>
                    ) : null}
                  </div>
                </MarkerPopup>
              </MapMarker>
            ) : null}
          </Map>
        </div>
      </div>

      {promptVisible ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[620px] rounded-[24px] border border-[var(--voltjo-border)] bg-white p-6 shadow-[0_20px_60px_rgba(13,13,13,0.12)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right">
                <h2 className="text-2xl font-black text-[var(--voltjo-black)] sm:text-3xl">
                  تفعيل الموقع الجغرافي
                </h2>
                <p className="mt-3 text-base font-semibold leading-8 text-[var(--voltjo-muted)]">
                  اسمح لـ VoltJo بتحديد موقعك لعرض مكانك على الخريطة وتسهيل الوصول إلى أقرب نقاط الشحن داخل الأردن.
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                  لن يتم حفظ موقعك إلا إذا اخترت ذلك صراحة.
                </p>
              </div>
              <button
                type="button"
                onClick={closePrompt}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-bg-soft)]"
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </button>
            </div>

            <label className="mt-6 flex items-center justify-end gap-3 text-sm font-semibold leading-7 text-[var(--voltjo-black)]">
              <span>احفظ موقعي لهذا الحساب لتجربة أدق لاحقًا</span>
              <input
                type="checkbox"
                checked={saveLocation}
                onChange={(event) => setSaveLocation(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--voltjo-border)] accent-[var(--voltjo-black)]"
              />
            </label>

            {geoError ? (
              <div className="mt-4 rounded-[16px] border border-[rgba(255,106,0,0.14)] bg-[rgba(255,106,0,0.06)] px-4 py-3 text-sm font-semibold leading-7 text-[var(--voltjo-black)]">
                {geoError}
              </div>
            ) : null}

            {!isAuthenticated && saveLocation ? (
              <div className="mt-4 rounded-[16px] border border-[var(--voltjo-border)] bg-[var(--voltjo-bg-soft)] px-4 py-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                يمكنك استخدام الموقع الآن، ولحفظه لاحقًا سجّل الدخول أولًا.
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={requestLocation}
                disabled={requestingLocation}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-black text-white transition hover:bg-[#1d1d1d] disabled:cursor-wait disabled:bg-[#1d1d1d] disabled:text-white"
              >
                <LocateFixed className="size-4" />
                <span>{requestingLocation ? "جارٍ تحديد الموقع..." : "تفعيل موقعي"}</span>
              </button>
              <button
                type="button"
                onClick={closePrompt}
                className="inline-flex h-11 items-center rounded-full border border-[var(--voltjo-border)] bg-white px-5 text-sm font-black text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-bg-soft)]"
              >
                المتابعة بدون تحديد الموقع
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
