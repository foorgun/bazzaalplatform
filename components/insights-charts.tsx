"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { Bucket } from "@/lib/insights";

/**
 * Chart colours.
 *
 * SERIES is a single-hue olive for every single-series bar chart. It is one
 * step darker than the brand accent (#A3A74B), which sits just above the
 * lightness band for dark surfaces — imperceptibly different, but validated.
 *
 * CATEGORICAL is the reference categorical order, dark steps, used in fixed
 * order and never cycled. Every segment is also directly labelled, so identity
 * never rests on colour alone.
 */
export const SERIES = "#939742";
export const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

const AXIS_TICK = { fill: "#8A8A85", fontSize: 11 };

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-hairline bg-surface p-5", className)}>
      <div className="mb-4">
        <h3 className="text-2xs uppercase tracking-wider text-ink-faint">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function TooltipCard({
  active,
  payload,
  suffix = "",
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: { label?: string } }[];
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const label = entry.payload?.label ?? entry.name ?? "";

  return (
    <div className="rounded-md border border-hairline bg-surface-2 px-2.5 py-1.5 shadow-lg shadow-black/50">
      <p className="text-[12px] text-ink">{label}</p>
      <p className="text-[13px] font-medium tabular-nums text-ink">
        {entry.value}
        {suffix}
      </p>
    </div>
  );
}

/** Vertical bars, one series — the olive needs no legend, the title names it. */
export function BucketBarChart({ data }: { data: Bucket[] }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={<TooltipCard />}
          />
          <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars with the name on the axis and the value at the end. */
export function RankedBarChart({ data, max = 100 }: { data: Bucket[]; max?: number }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
          barCategoryGap={10}
        >
          <XAxis type="number" domain={[0, max]} hide />
          <YAxis
            type="category"
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<TooltipCard />} />
          <Bar dataKey="value" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry) => (
              <Cell key={entry.label} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut + direct-labelled legend, so segments are never colour-only. */
export function BreakdownDonut({ data }: { data: Bucket[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative h-[164px] w-[164px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="#141414"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={CATEGORICAL[index % CATEGORICAL.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipCard />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-semibold leading-none tabular-nums text-ink">
            {total}
          </span>
          <span className="mt-0.5 text-2xs text-ink-faint">total</span>
        </div>
      </div>

      <ul className="min-w-[150px] flex-1 space-y-1.5">
        {data.map((entry, index) => (
          <li key={entry.label} className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: CATEGORICAL[index % CATEGORICAL.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-muted">{entry.label}</span>
            <span className="tabular-nums text-ink">{entry.value}</span>
            <span className="w-9 text-right tabular-nums text-ink-faint">
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
