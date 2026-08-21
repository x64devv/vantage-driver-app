'use client';

/* The route map.
 *
 * ⚠ Raster OpenStreetMap tiles under a grayscale filter, and the attribution
 * stays visible at 8px on an 80% plate — that is a LICENCE REQUIREMENT, not a
 * style choice. It is never removed.
 *
 * ⚠⚠ Never let a straight line pretend to be a route. Both polylines below are
 * real OSRM road geometry from lib/routes-cache.ts. If a geometry is missing the
 * leg is drawn dashed and the caption says the order is not routed, exactly as
 * the console's TripMap does.
 *
 * ⚠ Offline tiles are unsolved for the real product (Google's terms restrict
 * caching, and OSM's tile policy is not a CDN licence). For the demo: load the
 * map once on the room's wifi so the tiles sit in the browser cache.
 */

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { STOPS, TRIP, stopById } from '@/lib/run';
import { currentOrder, ranRoute, routeFor } from '@/lib/derive';

type Props = {
  accepted: boolean;
  done: Partial<Record<number, string>>;
  onSelect: (id: number) => void;
};

const ACCENT = '#ec3013';
const INK = '#201e1d';

function square(html: string, cls: string) {
  return L.divIcon({ className: '', html: `<div class="${cls}">${html}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
}

const dot = L.divIcon({ className: '', html: '<div class="mk-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

function Fit({ accepted }: { accepted: boolean }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [TRIP.startPosition, ...STOPS.map((s) => s.latlng)];
    map.fitBounds(L.latLngBounds(pts).pad(0.16));
    // The sheet above and below the map changes height with navMode, so the
    // container size is not what Leaflet measured on mount.
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map, accepted]);
  return null;
}

export default function RunMap({ accepted, done, onSelect }: Props) {
  const ids = currentOrder(accepted);
  const route = routeFor(ids);

  /* The remaining route: real road geometry when we have it, and a dashed
     straight run through the stops when we do not — dashed forever if the answer
     never lands. It must never look like a road it is not. */
  const remaining: [number, number][] =
    route?.coords?.length
      ? route.coords
      : [TRIP.startPosition, ...ids.map((id) => stopById(id).latlng)];
  const isRoad = !!route?.coords?.length;

  return (
    <MapContainer
      center={TRIP.startPosition}
      zoom={12}
      zoomControl
      attributionControl
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        className="lf-gs"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        maxZoom={18}
      />
      <Fit accepted={accepted} />

      {/* Already driven — stops 1 to 3 and back to where he is standing. Ink,
          thin, dashed: it is history, not the plan. */}
      <Polyline
        positions={ranRoute?.coords ?? []}
        pathOptions={{ color: INK, weight: 2, opacity: 0.35, dashArray: '5 5' }}
      />

      <Polyline
        positions={remaining}
        pathOptions={{
          color: ACCENT,
          weight: 4,
          opacity: 0.95,
          ...(isRoad ? {} : { dashArray: '6 6' }),
        }}
      />

      {/* ⚠ The driver's dot sits UNDER the stop markers. Leaflet orders markers
          by latitude, and his position is south of stop 4 — which put the dot on
          top of the accent square for the next stop and hid its number. The plan
          has to stay readable; where he is standing is the smaller fact. */}
      <Marker position={TRIP.startPosition} icon={dot} zIndexOffset={-1000} />

      {STOPS.map((s) => {
        const closed = !!done[s.id];
        const pos = ids.indexOf(s.id);
        const next = pos === 0;
        const cls = 'mk' + (closed ? ' mk-done' : next ? ' mk-next' : '');
        /* ⚠ The number is the stop's place in the CURRENT order, not its id. A
           delivered stop shows an x — it is off the plan, not renumbered. */
        const label = closed ? '×' : String(pos + 1);
        /* ⚠⚠ Leaflet stacks markers by latitude, which on this run put stop 3's
           delivered × on top of stop 4's accent square — the NEXT stop, the one
           the whole demo is about, hidden behind a stop already done. Stack by
           importance instead: next on top, then pending, then delivered, and the
           driver's dot underneath everything. */
        const z = next ? 1000 : closed ? -500 : 0;
        return (
          <Marker
            key={s.id}
            position={s.latlng}
            icon={square(label, cls)}
            zIndexOffset={z}
            eventHandlers={{ click: () => onSelect(s.id) }}
          />
        );
      })}
    </MapContainer>
  );
}
