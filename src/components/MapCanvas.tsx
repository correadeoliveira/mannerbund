import { useEffect, useRef, useState } from 'react';
import maplibregl, { type Map as LibreMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapTrifoldIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
import type { Community, Point } from '../domain/types';
import { Button } from './ui';
import { accessibleAccent } from '../lib/colors';

interface Props {
  points: Point[];
  owners: Record<string, Community | undefined>;
  selected?: string;
  onSelect: (id: string) => void;
  location?: { lat: number; lng: number };
  onPick?: (position: { lat: number; lng: number }) => void;
}
function circle(point: Point): GeoJSON.Feature<GeoJSON.Polygon> {
  const coordinates = Array.from({ length: 65 }, (_, n) => {
    const a = (n / 64) * Math.PI * 2;
    return [
      point.lng + (Math.cos(a) * point.radius) / (111320 * Math.cos((point.lat * Math.PI) / 180)),
      point.lat + (Math.sin(a) * point.radius) / 111320,
    ];
  });
  return {
    type: 'Feature',
    properties: { id: point.id },
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  };
}
export default function MapCanvas({ points, owners, selected, onSelect, location, onPick }: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<LibreMap | null>(null),
    markers = useRef<maplibregl.Marker[]>([]),
    onSelectRef = useRef(onSelect),
    onPickRef = useRef(onPick),
    lastSelection = useRef(selected);
  const [error, setError] = useState(false),
    [loaded, setLoaded] = useState(false),
    [attempt, setAttempt] = useState(0);
  onSelectRef.current = onSelect;
  onPickRef.current = onPick;
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      if (!cancelled) setError(true);
    }, 14000);
    setError(false);
    setLoaded(false);
    async function load() {
      try {
        const response = await fetch('https://tiles.openfreemap.org/styles/dark', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Mapa indisponível');
        const style = (await response.json()) as StyleSpecification;
        style.layers = style.layers.map((layer) => {
          if (layer.type === 'background')
            return { ...layer, paint: { ...layer.paint, 'background-color': '#1b211d' } };
          if (layer.type === 'fill') {
            const color = /water/.test(layer.id)
              ? '#313a32'
              : /park|wood|forest|grass/.test(layer.id)
                ? '#253024'
                : /building/.test(layer.id)
                  ? '#30332a'
                  : '#22271f';
            const paint = { ...layer.paint, 'fill-color': color };
            delete paint['fill-pattern'];
            return { ...layer, paint };
          }
          if (layer.type === 'line' && /road|highway|street|transport/.test(layer.id))
            return {
              ...layer,
              paint: {
                ...layer.paint,
                'line-color': /casing/.test(layer.id)
                  ? '#24291f'
                  : /motorway|trunk|primary/.test(layer.id)
                    ? '#626049'
                    : '#414436',
                'line-opacity': /motorway|trunk|primary/.test(layer.id) ? 0.8 : 0.58,
              },
            };
          if (layer.type === 'symbol' && layer.paint?.['text-color'])
            return {
              ...layer,
              paint: {
                ...layer.paint,
                'text-color': '#aaa999',
                'text-halo-color': '#22271f',
                'text-halo-width': 1,
              },
            };
          return layer;
        });
        if (cancelled || !container.current) return;
        const m = new maplibregl.Map({
          container: container.current,
          style,
          center: [-46.677, -23.56],
          zoom: 12.5,
          minZoom: 9,
          maxZoom: 18,
          attributionControl: { compact: true },
          maxPitch: 0,
          dragRotate: false,
          touchPitch: false,
        });
        map.current = m;
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        m.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');
        m.on('load', () => {
          clearTimeout(timeout);
          m.resize();
          if (points.length > 1) {
            const bounds = new maplibregl.LngLatBounds();
            points.forEach((p) => bounds.extend([p.lng, p.lat]));
            m.fitBounds(bounds, {
              padding: { top: 90, bottom: 70, left: 50, right: 50 },
              duration: 0,
              maxZoom: 12.8,
            });
          }
          if (!cancelled) {
            setError(false);
            setLoaded(true);
          }
        });
        m.on('click', (e) => onPickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
        m.on('error', () => {
          if (!m.isStyleLoaded()) setError(true);
        });
      } catch (e) {
        if (!cancelled && !(e instanceof DOMException && e.name === 'AbortError')) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;
    markers.current.forEach((marker) => marker.remove());
    const features: GeoJSON.Feature[] = points.map((p) => ({
      ...circle(p),
      properties: { id: p.id, color: accessibleAccent(owners[p.id]?.color ?? '#898a78') },
    }));
    const source = m.getSource('territories') as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData({ type: 'FeatureCollection', features });
    else {
      m.addSource('territories', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });
      m.addLayer({
        id: 'territory-fill',
        type: 'fill',
        source: 'territories',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.17 },
      });
      m.addLayer({
        id: 'territory-outline',
        type: 'line',
        source: 'territories',
        paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-opacity': 0.7 },
      });
    }
    markers.current = points.map((p) => {
      const owner = owners[p.id],
        button = document.createElement('button');
      button.className = `territory-marker ${selected === p.id ? 'marker-selected' : ''}`;
      button.style.setProperty('--marker-color', accessibleAccent(owner?.color ?? '#A7A798'));
      button.setAttribute(
        'aria-label',
        `${p.name}. ${owner ? `Território de ${owner.name}` : 'Território livre'}`,
      );
      const medallion = document.createElement('span');
      medallion.className = 'marker-medallion';
      const paths: Record<string, string> = {
        sun: '<path d="M5 18h22M8 14a8 8 0 0 1 16 0M16 3v3M4 8l3 2M28 8l-3 2M9 23h14"/>',
        mountain: '<path d="m3 24 10-17 5 8 4-6 9 15H3Zm7-12 3 4 3-4"/>',
        leaf: '<path d="M8 25C0 12 15 4 26 6c1 15-4 24-18 19Zm0 0L23 9M14 19h8M14 19v-6"/>',
        flame: '<path d="M17 3c2 9 10 10 9 18a10 10 0 0 1-20 0c0-6 5-9 6-12 0 6 4 7 5-6Z"/>',
        waves:
          '<path d="M3 10c5-6 8 6 14 0s9 3 12 0M3 17c5-6 8 6 14 0s9 3 12 0M3 24c5-6 8 6 14 0s9 3 12 0"/>',
        aperture: '<circle cx="16" cy="16" r="12"/><path d="m10 6 12 21M5 15h24M10 27 22 6"/>',
      };
      medallion.innerHTML = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[owner?.emblem ?? 'sun']}</svg>`;
      const label = document.createElement('span');
      label.className = 'marker-label';
      label.textContent = p.name;
      button.append(medallion, label);
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current(p.id);
      });
      return new maplibregl.Marker({ element: button, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .addTo(m);
    });
  }, [points, owners, selected, loaded]);
  useEffect(() => {
    if (selected !== lastSelection.current && loaded) {
      const p = points.find((p) => p.id === selected);
      if (p)
        map.current?.flyTo({
          center: [p.lng, p.lat],
          zoom: 14.1,
          duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900,
        });
      lastSelection.current = selected;
    }
  }, [selected, points, loaded]);
  useEffect(() => {
    if (location && loaded)
      map.current?.flyTo({ center: [location.lng, location.lat], zoom: 14, duration: 800 });
  }, [location, loaded]);
  return (
    <div className="map-canvas-wrap">
      <div
        ref={container}
        className="map-canvas"
        aria-label="Mapa interativo dos territórios de São Paulo"
      />
      {!loaded && !error && (
        <div className="map-loading">
          <span className="spinner" />
          <span>Preparando seu território…</span>
        </div>
      )}
      {error && (
        <div className="map-error">
          <MapTrifoldIcon size={32} />
          <h3>O mapa está indisponível</h3>
          <p>
            A lista de locais continua funcionando. Verifique a conexão ou a aceleração gráfica do
            navegador.
          </p>
          <Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}>
            <ArrowsClockwiseIcon size={17} />
            Tentar novamente
          </Button>
        </div>
      )}
      <div className="map-compass" aria-label="Norte">
        <span>N</span>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="m20 5 7 24-7-5-7 5Z" fill="#B68A4D" />
          <path d="M20 5v19l7 5Z" fill="#75603e" />
        </svg>
      </div>
    </div>
  );
}
