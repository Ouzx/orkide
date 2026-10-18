import { createApiClient } from "@orkide/api-client";
import type { Locale } from "@orkide/i18n";
import type { ReactNode, SubmitEvent } from "react";
import { startTransition, useActionState } from "react";

import type { ContactLabels } from "./labels.ts";
import { useTurnstile } from "./turnstile.ts";

interface ContactFormProps {
  readonly locale: Locale;
  readonly siteKey: string;
  readonly labels: ContactLabels;
}

/** Server-side problems keyed by field (RFC 9457 `issues`), plus a form-level message. */
interface FormState {
  readonly status: "idle" | "sent" | "failed";
  readonly message?: string;
  readonly fieldErrors?: Partial<Record<FieldName, string>>;
}

type FieldName = "name" | "email" | "subject" | "body";

interface Problem {
  readonly title?: string;
  readonly issues?: readonly { message: string; path: (string | number)[] }[];
}

const toFieldErrors = (problem: Problem): FormState["fieldErrors"] =>
  Object.fromEntries(
    (problem.issues ?? []).map((issue) => [issue.path.join("."), issue.message])
  );

/** The panel's status row: a lamp and a small screen reading what the form is doing. */
const status = (tone: "ok" | "warn", text: string) => (
  <div className="o-status">
    <span className="o-lamp" data-tone={tone} aria-hidden="true" />
    <span className="o-mini" aria-hidden="true">
      {text}
    </span>
  </div>
);

/**
 * Contact form island. Constraint attributes mirror `contactInputSchema`, so the browser validates
 * (in the visitor's language) before anything is sent; the API re-validates and answers with a
 * localized RFC 9457 problem when something still fails.
 */
export const ContactForm = ({ labels, locale, siteKey }: ContactFormProps) => {
  const {
    container: turnstileContainer,
    reset: resetTurnstile,
    token,
  } = useTurnstile(siteKey, locale);

  const [state, submit, pending] = useActionState<FormState, FormData>(
    async (_previous, form) => {
      const field = (name: FieldName) => String(form.get(name) ?? "").trim();
      const api = createApiClient(location.origin);
      const response = await api.api.contact.$post({
        json: {
          body: field("body"),
          email: field("email"),
          locale,
          name: field("name"),
          subject: field("subject") || null,
          turnstileToken: token ?? "",
        },
      });
      if (response.ok) {
        return { status: "sent" };
      }
      // Tokens are single-use: every failed attempt needs a fresh challenge.
      resetTurnstile();
      const problem: Problem = await response.json().catch(() => ({}));
      return {
        fieldErrors: toFieldErrors(problem),
        message: problem.title ?? labels.failed,
        status: "failed",
      };
    },
    { status: "idle" }
  );

  if (state.status === "sent") {
    return (
      <div aria-live="polite">
        {status("ok", labels.sentScreen)}
        <h2 className="o-sec-title m-0 text-2xl">{labels.successTitle}</h2>
        <p className="mt-2 mb-0 text-ink-2">{labels.successBody}</p>
      </div>
    );
  }

  const submitLabel = (() => {
    if (pending) {
      return labels.sending;
    }
    return token ? labels.submit : labels.verifying;
  })();

  // `onSubmit` rather than `<form action>`: a server-rendered action makes React inline a replay
  // script, which the hashed Content-Security-Policy (rightly) blocks.
  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => submit(data));
  };

  const field = (
    name: FieldName,
    label: ReactNode,
    control: (props: {
      "aria-describedby"?: string;
      "aria-invalid"?: true;
      className: string;
      id: string;
      name: FieldName;
    }) => ReactNode
  ) => {
    const error = state.fieldErrors?.[name];
    const id = `contact-${name}`;
    return (
      <div className="o-field">
        <label htmlFor={id} className="o-label">
          {label}
        </label>
        {control({
          "aria-describedby": error ? `${id}-error` : undefined,
          "aria-invalid": error ? true : undefined,
          className: "o-well",
          id,
          name,
        })}
        {error ? (
          <p id={`${id}-error`} className="o-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3.5">
      {status(pending ? "warn" : "ok", pending ? labels.sending : labels.ready)}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {field("name", labels.name, (props) => (
          <input {...props} autoComplete="name" required maxLength={120} />
        ))}
        {field("email", labels.email, (props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        ))}
      </div>
      {field(
        "subject",
        <>
          {labels.subject} <small>({labels.optional})</small>
        </>,
        (props) => (
          <input {...props} maxLength={160} />
        )
      )}
      {field("body", labels.body, (props) => (
        <textarea
          {...props}
          required
          minLength={10}
          maxLength={5000}
          rows={7}
        />
      ))}

      <div ref={turnstileContainer} />

      {state.status === "failed" && state.message ? (
        <p role="alert" className="o-error">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !token}
        className="o-key o-key-lg o-key-signal justify-self-start"
      >
        {submitLabel}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
};

export default ContactForm;
