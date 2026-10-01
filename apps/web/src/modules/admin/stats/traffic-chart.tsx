import { m } from "@orkide/i18n/messages";
import { useMemo } from "react";

import { useAdmin } from "../context.tsx";

interface Day {
  readonly day: string;
  readonly views: number;
  readonly visitors: number;
}

const HEIGHT = 160;
const GAP = 2;

/**
 * Daily views (tall bars) with unique visitors (inner bars), drawn as plain SVG. Screen readers
 * get the same numbers as a table; the graphic itself is hidden from them.
 */
export const TrafficChart = ({ days }: { readonly days: readonly Day[] }) => {
  const { locale, options } = useAdmin();
  const max = Math.max(1, ...days.map((day) => day.views));
  const width = Math.max(1, days.length) * 12;
  const short = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="h-40 w-full"
      >
        {days.map((day, index) => {
          const x = index * 12 + GAP / 2;
          const views = (day.views / max) * HEIGHT;
          const visitors = (day.visitors / max) * HEIGHT;
          return (
            <g key={day.day}>
              <rect
                x={x}
                y={HEIGHT - views}
                width={12 - GAP}
                height={views}
                rx="2"
                className="fill-chart-1/35"
              />
              <rect
                x={x + 2}
                y={HEIGHT - visitors}
                width={12 - GAP - 4}
                height={visitors}
                rx="1.5"
                className="fill-chart-2"
              />
            </g>
          );
        })}
      </svg>
      <figcaption className="flex justify-between text-xs text-muted-foreground">
        <span>{days[0] ? short.format(new Date(days[0].day)) : ""}</span>
        <span className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm bg-chart-1/35"
              aria-hidden="true"
            />
            {m.admin_stats_views({}, options)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-chart-2" aria-hidden="true" />
            {m.admin_stats_visitors({}, options)}
          </span>
        </span>
        <span>
          {days.at(-1) ? short.format(new Date(days.at(-1)?.day ?? "")) : ""}
        </span>
      </figcaption>
      <table className="sr-only">
        <caption>{m.admin_stats_daily({}, options)}</caption>
        <thead>
          <tr>
            <th scope="col">{m.admin_updated({}, options)}</th>
            <th scope="col">{m.admin_stats_views({}, options)}</th>
            <th scope="col">{m.admin_stats_visitors({}, options)}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.day}>
              <th scope="row">{short.format(new Date(day.day))}</th>
              <td>{day.views}</td>
              <td>{day.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
