import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TARGET, heatColor, type HeatCell, type HeatFrame } from "@/lib/heatmap";

interface Props {
  frame: HeatFrame;
  onSelect: (cell: HeatCell) => void;
  selectedId?: string | undefined;
}

export default function HeatLeafletMap({ frame, onSelect, selectedId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(
      TARGET.center,
      13.6,
    );
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      opacity: 0.55,
      pane: "shadowPane",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const temps = frame.cells.map((c) => c.temp_f);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const h = TARGET.cellSize / 2;
    frame.cells.forEach((cell, i) => {
      const t = max === min ? 0.5 : (cell.temp_f - min) / (max - min);
      const isSelected = selectedId === cell.id;
      const rect = L.rectangle(
        [
          [cell.lat - h, cell.lng - h],
          [cell.lat + h, cell.lng + h],
        ],
        {
          color: isSelected ? "#E8F1F8" : t > 0.92 ? "#FF6B35" : "transparent",
          weight: isSelected ? 2 : t > 0.92 ? 1 : 0,
          fillColor: heatColor(cell.temp_f, min, max),
          fillOpacity: 0.05,
          className: t > 0.92 ? "hs-hot-cell" : "",
        },
      );
      rect.bindTooltip(
        `<span style="font-family:'JetBrains Mono',monospace">${cell.temp_f.toFixed(1)}°F</span> · ${cell.surface_type}`,
        { sticky: true, className: "hs-tip" },
      );
      rect.on("click", () => selectRef.current(cell));
      rect.on("mouseover", () => rect.setStyle({ fillOpacity: 0.85 }));
      rect.on("mouseout", () => rect.setStyle({ fillOpacity: 0.62 }));
      rect.addTo(layer);
      // showcase reveal: tiles bloom in from cool to hot
      const el = (rect as unknown as { _path?: SVGElement })._path;
      if (el) {
        el.style.transition = "fill-opacity 420ms ease";
        window.setTimeout(() => rect.setStyle({ fillOpacity: 0.62 }), 60 + i * 6);
      }
    });
  }, [frame, selectedId]);

  return (
    <>
      <style>{`
        .hs-tip{background:#0C2340;border:1px solid #1E4A70;color:#E8F1F8;font-size:11px;border-radius:8px;box-shadow:none}
        .hs-tip::before{border-top-color:#1E4A70!important}
        .hs-hot-cell{filter:drop-shadow(0 0 6px rgba(255,107,53,.8))}
        .leaflet-container{background:#08192E;font-family:'Manrope',sans-serif}
        .leaflet-bar a{background:#0C2340;color:#8FB0C9;border-color:#1E4A70}
        .leaflet-bar a:hover{background:#123A5C;color:#E8F1F8}
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}
