"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { Bucket } from "@/lib/insights";

/** [longitude, latitude] for every market the roster or the expansion list uses. */
const COORDS: Record<string, [number, number]> = {
  US: [-98, 39],
  CA: [-106, 56],
  MX: [-102, 23],
  BR: [-51, -14],
  UK: [-2, 54],
  FR: [2, 46],
  DE: [10, 51],
  ES: [-4, 40],
  IT: [12, 42],
  NL: [5, 52],
  PL: [19, 52],
  SE: [15, 62],
  KR: [128, 36],
  JP: [138, 36],
  SG: [104, 1],
  TH: [101, 15],
  VN: [108, 14],
  ID: [113, -2],
  PH: [122, 12],
  IN: [79, 22],
  AE: [54, 24],
  AU: [134, -25],
};

const EXPANSION = ["KR", "DE", "JP", "UK", "FR"];

const COUNTRY_LABEL: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom",
  DE: "Germany",
  FR: "France",
  KR: "South Korea",
  JP: "Japan",
  CA: "Canada",
  AU: "Australia",
};

export function InsightsMap({ countries }: { countries: Bucket[] }) {
  const current = countries.filter((c) => COORDS[c.label]);
  const currentCodes = new Set(current.map((c) => c.label));
  const potential = EXPANSION.filter((code) => !currentCodes.has(code) && COORDS[code]);
  const biggest = current[0];

  return (
    <div>
      <div className="overflow-hidden rounded-md bg-[#101010]">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 165 }}
          width={980}
          height={420}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography="/world-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1A1A1A"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#202020" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Potential markets — dimmer, dashed */}
          {potential.map((code) => (
            <Marker key={code} coordinates={COORDS[code]}>
              <circle
                r={7}
                fill="rgba(163,167,75,0.08)"
                stroke="#5C5C58"
                strokeWidth={1.2}
                strokeDasharray="2 2"
              />
              <text
                textAnchor="middle"
                y={-12}
                style={{ fill: "#5C5C58", fontSize: 10, letterSpacing: "0.04em" }}
              >
                {code}
              </text>
            </Marker>
          ))}

          {/* Current markets — accent, sized by roster share */}
          {current.map((market) => {
            const isBiggest = market.label === biggest?.label;
            const radius = isBiggest ? 13 : 8;
            return (
              <Marker key={market.label} coordinates={COORDS[market.label]}>
                <circle r={radius + 5} fill="rgba(163,167,75,0.14)" />
                <circle r={radius} fill="#A3A74B" fillOpacity={0.9} />
                <text
                  textAnchor="middle"
                  y={4}
                  style={{ fill: "#0C0C0C", fontSize: 11, fontWeight: 600 }}
                >
                  {market.value}
                </text>
                {isBiggest && (
                  <text
                    textAnchor="middle"
                    y={radius + 17}
                    style={{ fill: "#F2F2F0", fontSize: 11 }}
                  >
                    {market.value} influencer{market.value === 1 ? "" : "s"} · {market.label}
                  </text>
                )}
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-2xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          Current
          <span className="text-ink-faint">
            ({current.map((c) => COUNTRY_LABEL[c.label] ?? c.label).join(", ") || "none"})
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-ink-faint" />
          Potential markets
          <span className="text-ink-faint">
            ({potential.map((c) => COUNTRY_LABEL[c] ?? c).join(", ") || "all covered"})
          </span>
        </span>
      </div>
    </div>
  );
}
