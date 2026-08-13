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
    const map = L.map(containerRef.current, { zoomControl: true }).setView(TARGET.center, 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 19,
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
    for (const cell of frame.cells) {
      const rect = L.rectangle(
        [
          [cell.lat - h, cell.lng - h],
          [cell.lat + h, cell.lng + h],
        ],
        {
          color: selectedId === cell.id ? "#ffffff" : "transparent",
          weight: selectedId === cell.id ? 2 : 0,
          fillColor: heatColor(cell.temp_f, min, max),
          fillOpacity: 0.62,
        },
      );
      rect.bindTooltip(`${cell.temp_f.toFixed(1)}°F · ${cell.surface_type}`, { sticky: true });
      rect.on("click", () => selectRef.current(cell));
      rect.addTo(layer);
    }
  }, [frame, selectedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
