"use client";

import maplibregl, {
  GeolocateControl,
  NavigationControl,
  Popup,
  type LngLatLike,
  type Map as MapLibreMap,
  type MapOptions,
  type MarkerOptions,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

type MapContextValue = {
  map: MapLibreMap | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used inside Map.");
  }
  return context;
}

type MapProps = Omit<MapOptions, "container" | "style"> & {
  children?: ReactNode;
  className?: string;
  styleUrl?: string;
};

const defaultStyle = "https://tiles.openfreemap.org/styles/bright";

export function Map({
  children,
  className,
  styleUrl = defaultStyle,
  ...options
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialOptionsRef = useRef({
    styleUrl,
    options,
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
      maplibregl
        .setRTLTextPlugin(
          "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
          true
        )
        .catch((err) => {
          console.error("Error loading MapLibre RTL text plugin:", err);
        });
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialOptionsRef.current.styleUrl,
      attributionControl: { compact: true },
      ...initialOptionsRef.current.options,
    });

    mapRef.current = map;

    const handleLoad = () => setIsLoaded(true);
    map.on("load", handleLoad);

    return () => {
      map.off("load", handleLoad);
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, []);

  return (
    <MapContext.Provider value={{ map: mapRef.current, isLoaded }}>
      <div ref={containerRef} className={cn("relative h-full w-full", className)}>
        <style dangerouslySetInnerHTML={{ __html: `
          .maplibregl-ctrl-attrib,
          .maplibregl-ctrl-attrib-inner,
          .maplibregl-attrib,
          [class*="maplibregl-ctrl-attrib"],
          [class*="maplibre-ctrl-attrib"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            pointer-events: none !important;
          }
        `}} />
        {mapRef.current ? children : null}
      </div>
    </MapContext.Provider>
  );
}

export function MapControls({
  showNavigation = true,
  showGeolocate = true,
}: {
  showNavigation?: boolean;
  showGeolocate?: boolean;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const controls: Array<NavigationControl | GeolocateControl> = [];

    if (showNavigation) {
      const navigation = new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      });
      map.addControl(navigation, "bottom-right");
      controls.push(navigation);
    }

    if (showGeolocate) {
      const geolocate = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: false,
        showUserLocation: true,
      });
      map.addControl(geolocate, "bottom-right");
      controls.push(geolocate);
    }

    return () => {
      controls.forEach((control) => {
        try {
          map.removeControl(control);
        } catch {
          // ignore
        }
      });
    };
  }, [isLoaded, map, showGeolocate, showNavigation]);

  return null;
}

type MarkerContextValue = {
  marker: maplibregl.Marker;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error("Marker subcomponents must be used inside MapMarker.");
  }
  return context;
}

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  children: ReactNode;
} & Omit<MarkerOptions, "element">;

export function MapMarker({
  longitude,
  latitude,
  children,
  ...options
}: MapMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  if (!markerRef.current) {
    markerRef.current = new maplibregl.Marker({
      element: document.createElement("div"),
      ...options,
    }).setLngLat([longitude, latitude]);
  }

  useEffect(() => {
    if (!map || !markerRef.current) return;
    markerRef.current.addTo(map);

    return () => {
      markerRef.current?.remove();
    };
  }, [map]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [latitude, longitude]);

  return (
    <MarkerContext.Provider value={{ marker: markerRef.current }}>
      {children}
    </MarkerContext.Provider>
  );
}

export function MarkerContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { marker } = useMarkerContext();

  return createPortal(
    <div className={cn("relative", className)}>{children}</div>,
    marker.getElement(),
  );
}

export function MarkerLabel({
  children,
  position = "bottom",
}: {
  children: ReactNode;
  position?: "bottom" | "top";
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-[rgba(13,13,13,0.08)] bg-white/96 px-3 py-1 text-[11px] font-black text-[var(--voltjo-black)] shadow-[0_10px_24px_rgba(13,13,13,0.12)]",
        position === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
      )}
    >
      {children}
    </div>
  );
}

type MarkerPopupProps = {
  children: ReactNode;
  className?: string;
  closeOnClick?: boolean;
  offset?: number;
};

export function MarkerPopup({
  children,
  className,
  closeOnClick = true,
  offset = 20,
}: MarkerPopupProps) {
  const { marker } = useMarkerContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<Popup | null>(null);

  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
  }

  if (!popupRef.current) {
    popupRef.current = new maplibregl.Popup({
      offset,
      closeButton: false,
      closeOnClick,
      maxWidth: "none",
    }).setDOMContent(containerRef.current);
  }

  useEffect(() => {
    if (!popupRef.current) return;
    popupRef.current.setDOMContent(containerRef.current!);
    marker.setPopup(popupRef.current);

    return () => {
      marker.setPopup(undefined);
      popupRef.current?.remove();
    };
  }, [marker]);

  return createPortal(
    <div
      className={cn(
        "w-[290px] overflow-hidden rounded-[20px] border border-[rgba(13,13,13,0.08)] bg-white p-0 text-right shadow-[0_24px_60px_rgba(13,13,13,0.18)]",
        className,
      )}
      dir="rtl"
    >
      {children}
    </div>,
    containerRef.current,
  );
}

export function flyToLocation(
  map: MapLibreMap | null,
  center: LngLatLike,
  zoom = 14,
) {
  if (!map) return;
  map.flyTo({
    center,
    zoom,
    essential: true,
    speed: 0.9,
    curve: 1.2,
  });
}
