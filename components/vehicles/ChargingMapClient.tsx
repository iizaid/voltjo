"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPinned, Navigation, PlugZap } from "lucide-react";
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
};

const jordanCenter = {
  longitude: 35.9106,
  latitude: 31.9539,
  zoom: 7,
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

function hasCoordinates(location: ChargingLocation) {
  return typeof location.latitude === "number" && typeof location.longitude === "number";
}

function buildDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

function buildMapOpenUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
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
      padding: 70,
      maxZoom: 9.8,
      duration: 0,
    });
  }, [isLoaded, locations, map, userLocation]);

  return null;
}

export function ChargingMapClient({ locations }: Props) {
  const [promptVisible, setPromptVisible] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const mappedLocations = useMemo(
    () => locations.filter(hasCoordinates),
    [locations],
  );

  const handleEnableLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMessage("المتصفح الحالي لا يدعم تحديد الموقع الجغرافي. يمكنك المتابعة بدون تحديد الموقع.");
      setPromptVisible(false);
      return;
    }

    setRequestingLocation(true);
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setPromptVisible(false);
        setRequestingLocation(false);
      },
      () => {
        setGeoMessage(
          "لم نتمكن من الوصول إلى موقعك. يمكنك تفعيل الصلاحية من إعدادات المتصفح أو المتابعة بدون تحديد الموقع.",
        );
        setPromptVisible(false);
        setRequestingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleContinueWithoutLocation = () => {
    setPromptVisible(false);
    setGeoMessage(null);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {promptVisible ? (
        <div className="rounded-[24px] border border-[var(--voltjo-border)] bg-white p-5 shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-right">
              <p className="text-xl font-black text-[var(--voltjo-black)]">
                حدد موقعك لعرض أقرب نقاط الشحن
              </p>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                يمكنك تفعيل الموقع الجغرافي لعرض مكانك على الخريطة وتسهيل الوصول إلى محطات الشحن القريبة. لا يتم حفظ موقعك في هذه المرحلة.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleEnableLocation}
                disabled={requestingLocation}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-black text-white transition hover:bg-[#1d1d1d] disabled:cursor-wait disabled:opacity-70"
              >
                <LocateFixed className="size-4" />
                <span>{requestingLocation ? "جارٍ تحديد الموقع..." : "تفعيل موقعي"}</span>
              </button>
              <button
                type="button"
                onClick={handleContinueWithoutLocation}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-5 text-sm font-black text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.2)] hover:text-[var(--voltjo-orange)]"
              >
                المتابعة بدون تحديد الموقع
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {geoMessage ? (
        <div className="rounded-[18px] border border-[rgba(255,106,0,0.14)] bg-[rgba(255,106,0,0.06)] px-4 py-4 text-sm font-semibold leading-7 text-[var(--voltjo-black)]">
          {geoMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-[var(--voltjo-border)] bg-white shadow-[0_20px_56px_rgba(13,13,13,0.08)]">
        <div className="flex items-center justify-between border-b border-[var(--voltjo-border)] px-5 py-4">
          <div className="text-right">
            <p className="text-lg font-black text-[var(--voltjo-black)]">
              خريطة محطات الشحن
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--voltjo-muted)]">
              {mappedLocations.length
                ? `نقاط مرئية حاليًا: ${mappedLocations.length}`
                : "لا توجد نقاط شحن موثقة معروضة بعد"}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[rgba(255,106,0,0.14)] bg-[rgba(255,106,0,0.06)] px-3 py-2 text-xs font-black text-[var(--voltjo-orange)]">
            <PlugZap className="size-4" />
            <span>VoltJo Map MVP</span>
          </div>
        </div>

        <div className="relative h-[520px] md:h-[680px]">
          <Map
            center={[jordanCenter.longitude, jordanCenter.latitude]}
            zoom={jordanCenter.zoom}
            className="h-full w-full"
          >
            <MapControls showNavigation showGeolocate />
            <MapViewportManager locations={mappedLocations} userLocation={userLocation} />

            {mappedLocations.map((location) => (
              <MapMarker
                key={location.id}
                longitude={location.longitude as number}
                latitude={location.latitude as number}
              >
                <MarkerContent>
                  <div className="relative">
                    <div className="size-5 rounded-full border-2 border-white bg-[var(--voltjo-orange)] shadow-[0_10px_24px_rgba(255,106,0,0.35)]" />
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
                      <a
                        href={buildMapOpenUrl(location.latitude as number, location.longitude as number)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--voltjo-border)] px-4 text-sm font-black text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.2)] hover:text-[var(--voltjo-orange)]"
                      >
                        فتح في الخرائط
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
                    <div className="size-5 rounded-full border-2 border-white bg-[#111827] shadow-[0_10px_24px_rgba(17,24,39,0.35)]" />
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
                      يُستخدم هذا الموقع فقط داخل المتصفح لتسهيل استعراض أقرب محطات الشحن على الخريطة.
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ) : null}
          </Map>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--voltjo-border)] bg-white px-5 py-4">
        <p className="text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
          {mappedLocations.length
            ? "يمكنك فتح تفاصيل كل محطة من العلامة البرتقالية مباشرة."
            : "لم نضف نقاط شحن موثقة بعد، لكن يمكنك تفعيل موقعك لرؤية تمركزك على الخريطة."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--voltjo-border)] px-4 text-sm font-black text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.2)] hover:text-[var(--voltjo-orange)]"
          >
            العودة للرئيسية
          </Link>
          <Link
            href="/assistant"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--voltjo-black)] px-4 text-sm font-black text-white transition hover:bg-[#1f1f1f]"
          >
            اسأل المساعد
          </Link>
        </div>
      </div>
    </div>
  );
}
