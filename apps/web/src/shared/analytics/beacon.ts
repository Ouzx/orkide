import type { TrackEvent } from "@orkide/validators/stats";
import type { Metric } from "web-vitals";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const ENDPOINT = "/api/track";

/** Fire-and-forget: `sendBeacon` survives page unloads and never blocks the main thread. */
const send = (event: TrackEvent): void => {
  const body = new Blob([JSON.stringify(event)], { type: "application/json" });
  if (!navigator.sendBeacon(ENDPOINT, body)) {
    void fetch(ENDPOINT, { body, keepalive: true, method: "POST" });
  }
};

const path = location.pathname;

const referrer = (): string | undefined => {
  if (!document.referrer) {
    return undefined;
  }
  const { origin, pathname } = new URL(document.referrer);
  // Same-site navigations are not referrals; external ones are reduced to origin + path.
  return origin === location.origin
    ? undefined
    : `${origin}${pathname}`.slice(0, 512);
};

const reportVital = ({ name, rating, value }: Metric): void =>
  send({ name, path, rating, type: "vital", value });

/**
 * Cookie-less analytics: one page view plus Core Web Vitals field data per page load. The API
 * derives a daily-rotating anonymous visitor hash; nothing is stored in the browser.
 */
export const startBeacon = (locale: string): void => {
  // The page view carries the server-rendered locale; the API rejects anything unknown.
  send({ locale, path, referrer: referrer(), type: "pageview" } as TrackEvent);
  onCLS(reportVital);
  onFCP(reportVital);
  onINP(reportVital);
  onLCP(reportVital);
  onTTFB(reportVital);
};
