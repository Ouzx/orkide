import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Button } from "@orkide/ui/components/button";
import { Fingerprint } from "lucide-react";
import { useState } from "react";

import { authClient } from "./auth-client.ts";

/** The GitHub mark (lucide no longer ships brand icons). */
const GitHubMark = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="size-4"
    fill="currentColor"
  >
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
  </svg>
);

/**
 * Sign-in screen: GitHub OAuth (restricted to allow-listed emails by the API) or a passkey that
 * was registered from the Account page.
 */
export const SignIn = ({
  locale,
  callbackPath,
}: {
  readonly locale: Locale;
  readonly callbackPath: string;
}) => {
  const options = { locale };
  const [pending, setPending] = useState<"github" | "passkey">();
  const [failed, setFailed] = useState(false);

  const github = async () => {
    setPending("github");
    setFailed(false);
    const result = await authClient.signIn.social({
      callbackURL: callbackPath,
      errorCallbackURL: `${callbackPath}/sign-in?error=1`,
      provider: "github",
    });
    if (result.error) {
      setFailed(true);
      setPending(undefined);
    }
  };

  const passkey = async () => {
    setPending("passkey");
    setFailed(false);
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      setFailed(true);
      setPending(undefined);
      return;
    }
    globalThis.location.assign(callbackPath);
  };

  const errorFromRedirect = new URLSearchParams(globalThis.location.search).has(
    "error"
  );

  return (
    <main className="relative z-10 grid min-h-dvh place-items-center px-4">
      <div className="live-border w-full max-w-sm space-y-8 rounded-3xl border glass p-8 text-center">
        <img src="/favicon.svg" alt="" className="mx-auto size-14" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {m.admin_sign_in_title({}, options)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {m.admin_sign_in_lead({}, options)}
          </p>
        </div>
        <div className="space-y-3">
          <div className="shine rounded-full">
            <Button
              size="pill"
              className="w-full"
              disabled={pending !== undefined}
              onClick={github}
            >
              <GitHubMark />
              {m.admin_sign_in_github({}, options)}
            </Button>
          </div>
          <Button
            size="pill"
            variant="outline"
            className="w-full"
            disabled={pending !== undefined}
            onClick={passkey}
          >
            <Fingerprint aria-hidden="true" />
            {m.admin_sign_in_passkey({}, options)}
          </Button>
        </div>
        {failed || errorFromRedirect ? (
          <p role="alert" className="text-sm text-destructive">
            {m.admin_sign_in_failed({}, options)}
          </p>
        ) : null}
      </div>
    </main>
  );
};

export default SignIn;
