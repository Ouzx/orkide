import { useEffect, useState } from "react";

const number = new Intl.NumberFormat();

/**
 * Live visitor count from the API's server-sent `presence` events (every few seconds). The
 * browser reconnects the EventSource automatically after network blips.
 */
export const LiveVisitors = () => {
  const [count, setCount] = useState<number>();

  useEffect(() => {
    const source = new EventSource("/api/live/feed");
    source.addEventListener("presence", (event) => {
      const { visitors } = JSON.parse(event.data) as { visitors: number };
      setCount(visitors);
    });
    return () => source.close();
  }, []);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex size-2.5" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-3/70" />
        <span className="relative inline-flex size-2.5 rounded-full bg-chart-3" />
      </span>
      <output aria-live="polite">
        {count === undefined ? "–" : number.format(count)}
      </output>
    </span>
  );
};
