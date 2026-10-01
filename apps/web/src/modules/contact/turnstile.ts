import { useCallback, useEffect, useState } from "react";

interface TurnstileOptions {
  sitekey: string;
  action?: string;
  language?: string;
  theme?: "auto" | "light" | "dark";
  appearance?: "always" | "execute" | "interaction-only";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface Turnstile {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<Turnstile> | undefined;

/** Loads the Turnstile script once, on demand (allowed by the CSP `script-src`). */
const loadTurnstile = (): Promise<Turnstile> => {
  if (loading) {
    return loading;
  }
  const { promise, resolve, reject } = Promise.withResolvers<Turnstile>();
  const script = document.createElement("script");
  script.src = SCRIPT_URL;
  script.async = true;
  script.addEventListener("load", () =>
    window.turnstile
      ? resolve(window.turnstile)
      : reject(new Error("Turnstile failed to initialise"))
  );
  script.addEventListener("error", () =>
    reject(new Error("Turnstile failed to load"))
  );
  // `appendChild`, not `append`: the Workers types (HTMLRewriter's `Element.append`) shadow the
  // DOM overload in this mixed server/browser project.
  // oxlint-disable-next-line unicorn/prefer-dom-node-append
  document.head.appendChild(script);
  loading = promise;
  return promise;
};

/**
 * Renders an (interaction-only) Turnstile widget into the element given to `container` (a callback
 * ref) and exposes the current token. `reset` issues a fresh challenge — tokens are single-use.
 */
export const useTurnstile = (siteKey: string, language: string) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [widget, setWidget] = useState<{ api: Turnstile; id: string }>();
  const [token, setToken] = useState<string>();

  useEffect(() => {
    if (!element) {
      return;
    }
    let rendered: { api: Turnstile; id: string } | undefined;
    let cancelled = false;
    const mount = async () => {
      const api = await loadTurnstile();
      if (cancelled) {
        return;
      }
      const id = api.render(element, {
        action: "contact",
        appearance: "interaction-only",
        callback: setToken,
        "error-callback": () => setToken(undefined),
        "expired-callback": () => setToken(undefined),
        language,
        sitekey: siteKey,
        theme: "auto",
      });
      rendered = { api, id };
      setWidget(rendered);
    };
    void mount();
    return () => {
      cancelled = true;
      rendered?.api.remove(rendered.id);
    };
  }, [element, siteKey, language]);

  const reset = useCallback(() => {
    setToken(undefined);
    widget?.api.reset(widget.id);
  }, [widget]);

  return { container: setElement, reset, token };
};
