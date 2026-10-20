import { m } from "@orkide/i18n/messages";
import { plot } from "@orkide/ui/effects/plot";
import type { StatsOverview } from "@orkide/validators/stats";
import { useMemo } from "react";

import { useAdmin } from "../context.tsx";

type Day = StatsOverview["daily"][number];

const WIDTH = 600;
const HEIGHT = 180;

/**
 * Daily views plotted on graph paper: a line over a hatched area, the grid divided in quarters,
 * and the busiest day marked in redline. Screen readers get the numbers (views and visitors) as a
 * table; the plot itself is hidden from them.
 */
export const TrafficChart = ({ days }: { readonly days: readonly Day[] }) => {
  const { locale, options } = useAdmin();
  const max = Math.max(1, ...days.map((day) => day.views));
  const short = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );
  const step = days.length > 1 ? WIDTH / (days.length - 1) : WIDTH;
  const points = days.map(
    (day, index) =>
      [index * step, HEIGHT - (day.views / max) * (HEIGHT - 12)] as const
  );
  const line = points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    )
    .join("");
  const busiest = days.findIndex((day) => day.views === max && day.views > 0);
  const peak = points[busiest];

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-44 w-full overflow-visible"
        aria-hidden="true"
      >
        {Array.from({ length: plot.divisions + 1 }, (_, index) => (
          <line
            key={index}
            x1="0"
            x2={WIDTH}
            y1={(HEIGHT / plot.divisions) * index}
            y2={(HEIGHT / plot.divisions) * index}
            className="stroke-line-3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {points.length > 1 ? (
          <>
            <path
              d={`${line}L${WIDTH} ${HEIGHT}L0 ${HEIGHT}Z`}
              fill="url(#o-hatch)"
              stroke="none"
            />
            <path
              d={line}
              fill="none"
              className="stroke-line"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {peak ? (
          <circle
            cx={peak[0]}
            cy={peak[1]}
            r={plot.peakRadius}
            className="fill-mark"
          />
        ) : null}
      </svg>
      <figcaption className="o-label flex justify-between gap-3">
        <span>{days[0] ? short.format(new Date(days[0].day)) : ""}</span>
        <span className="flex items-center gap-1.5">
          <span className="o-dot" data-tone="mark" aria-hidden="true" />
          {m.admin_stats_views({}, options)}
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
