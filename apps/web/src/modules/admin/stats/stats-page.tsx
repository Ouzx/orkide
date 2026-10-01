import { m } from "@orkide/i18n/messages";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orkide/ui/components/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@orkide/ui/components/toggle-group";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CLSThresholds,
  FCPThresholds,
  INPThresholds,
  LCPThresholds,
  TTFBThresholds,
} from "web-vitals";

import { queries } from "../api.ts";
import {
  EmptyRow,
  PageHeader,
  Panel,
  QueryBoundary,
  StatTile,
} from "../components/page.tsx";
import { useAdmin } from "../context.tsx";
import { LiveVisitors } from "./live-visitors.tsx";
import { TrafficChart } from "./traffic-chart.tsx";

const RANGES = [7, 30, 90] as const;
const number = new Intl.NumberFormat();

/** Google's "good" / "poor" boundaries, straight from the `web-vitals` package. */
const THRESHOLDS = {
  CLS: CLSThresholds,
  FCP: FCPThresholds,
  INP: INPThresholds,
  LCP: LCPThresholds,
  TTFB: TTFBThresholds,
} as const;

const formatVital = (name: keyof typeof THRESHOLDS, value: number) =>
  name === "CLS" ? value.toFixed(3) : `${Math.round(value)} ms`;

const Overview = ({ days }: { readonly days: number }) => {
  const { options } = useAdmin();
  const { data } = useSuspenseQuery(queries.stats(days));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={m.admin_stats_views({}, options)}>
          {number.format(data.totals.views)}
        </StatTile>
        <StatTile label={m.admin_stats_visitors({}, options)}>
          {number.format(data.totals.visitors)}
        </StatTile>
        <StatTile label={m.admin_stats_online({}, options)}>
          <LiveVisitors />
        </StatTile>
      </div>
      <Panel title={m.admin_stats_daily({}, options)}>
        {data.daily.length > 0 ? (
          <TrafficChart days={data.daily} />
        ) : (
          <EmptyRow>{m.admin_stats_no_data({}, options)}</EmptyRow>
        )}
      </Panel>
      <Panel title={m.admin_stats_top_pages({}, options)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">
                {m.admin_stats_views({}, options)}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topPaths.map((row) => (
              <TableRow key={row.path}>
                <TableCell>
                  <span className="block max-w-96 truncate font-mono text-sm">
                    {row.path}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="tabular-nums">
                    {number.format(row.views)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
};

const vitalRating = (
  name: keyof typeof THRESHOLDS,
  p75: number
): "good" | "fair" | "poor" => {
  const [good, poor] = THRESHOLDS[name];
  if (p75 <= good) {
    return "good";
  }
  return p75 <= poor ? "fair" : "poor";
};

const Vitals = ({ days }: { readonly days: number }) => {
  const { options } = useAdmin();
  const { data } = useSuspenseQuery(queries.vitals(days));
  if (data.length === 0) {
    return <EmptyRow>{m.admin_stats_no_data({}, options)}</EmptyRow>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {data.map((vital) => (
        <StatTile
          key={vital.name}
          label={vital.name}
          hint={`n = ${number.format(vital.samples)}`}
          rating={vitalRating(vital.name, vital.p75)}
        >
          {formatVital(vital.name, vital.p75)}
        </StatTile>
      ))}
    </div>
  );
};

export const StatsPage = () => {
  const { options } = useAdmin();
  const [days, setDays] = useState<number>(30);
  return (
    <>
      <PageHeader
        title={m.admin_stats_title({}, options)}
        actions={
          <ToggleGroup
            value={[String(days)]}
            onValueChange={(value) => setDays(Number(value[0] ?? days))}
            variant="outline"
            size="sm"
          >
            {RANGES.map((range) => (
              <ToggleGroupItem key={range} value={String(range)}>
                {m.admin_stats_range({ days: String(range) }, options)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />
      <div className="space-y-6">
        <QueryBoundary>
          <Overview days={days} />
        </QueryBoundary>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            {m.admin_stats_vitals({}, options)}
          </h2>
          <QueryBoundary>
            <Vitals days={days} />
          </QueryBoundary>
        </section>
      </div>
    </>
  );
};
