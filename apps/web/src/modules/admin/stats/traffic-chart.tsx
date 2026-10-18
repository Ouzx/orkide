import { m } from "@orkide/i18n/messages";
import { meters } from "@orkide/ui/effects/meters";
import { useMemo } from "react";
import type { CSSProperties } from "react";

import { useAdmin } from "../context.tsx";

interface Day {
  readonly day: string;
  readonly views: number;
  readonly visitors: number;
}

/**
 * Daily views as the columns of an LED meter: each day lights segments in proportion to its views,
 * and the busiest day's top segments glow hot. Screen readers get the numbers (views and visitors)
 * as a table; the meter itself is hidden from them.
 */
export const TrafficChart = ({ days }: { readonly days: readonly Day[] }) => {
  const { locale, options } = useAdmin();
  const max = Math.max(1, ...days.map((day) => day.views));
  const short = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );

  return (
    <figure className="space-y-3">
      <div className="o-vu" aria-hidden="true">
        {days.map((day, column) => {
          const { peakSegments, segments } = meters.vu;
          const lit = Math.round((day.views / max) * segments);
          const busiest = day.views === max && day.views > 0;
          return (
            <div key={day.day} className="o-vu-col">
              {Array.from({ length: segments }, (_, index) => {
                const level = segments - index;
                const on = level <= lit;
                return (
                  <i
                    key={level}
                    data-on={on ? "" : undefined}
                    data-peak={
                      on && busiest && level > segments - peakSegments
                        ? ""
                        : undefined
                    }
                    style={{ "--k": column + index } as CSSProperties}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <figcaption className="o-eng flex justify-between gap-3">
        <span>{days[0] ? short.format(new Date(days[0].day)) : ""}</span>
        <span className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="o-lamp" data-tone="signal" aria-hidden="true" />
            {m.admin_stats_views({}, options)}
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
