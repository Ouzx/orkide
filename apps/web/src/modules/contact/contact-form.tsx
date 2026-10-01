import { createApiClient } from "@orkide/api-client";
import type { Locale } from "@orkide/i18n";
import { Button } from "@orkide/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@orkide/ui/components/field";
import { Input } from "@orkide/ui/components/input";
import { Textarea } from "@orkide/ui/components/textarea";
import { CircleCheck, Send } from "lucide-react";
import type { SubmitEvent } from "react";
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
      <div
        aria-live="polite"
        className="flex flex-col items-start gap-3 rounded-2xl border glass p-8"
      >
        <CircleCheck aria-hidden="true" className="size-8 text-primary" />
        <h2 className="text-xl font-semibold">{labels.successTitle}</h2>
        <p className="text-muted-foreground">{labels.successBody}</p>
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

  const errorFor = (name: FieldName) => {
    const message = state.fieldErrors?.[name];
    return message ? [{ message }] : undefined;
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border glass p-6 sm:p-8">
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={errorFor("name") ? true : undefined}>
            <FieldLabel htmlFor="contact-name">{labels.name}</FieldLabel>
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              aria-invalid={errorFor("name") ? true : undefined}
            />
            <FieldError errors={errorFor("name")} />
          </Field>
          <Field data-invalid={errorFor("email") ? true : undefined}>
            <FieldLabel htmlFor="contact-email">{labels.email}</FieldLabel>
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              aria-invalid={errorFor("email") ? true : undefined}
            />
            <FieldError errors={errorFor("email")} />
          </Field>
        </div>
        <Field data-invalid={errorFor("subject") ? true : undefined}>
          <FieldLabel htmlFor="contact-subject">
            {labels.subject}{" "}
            <span className="font-normal text-muted-foreground">
              ({labels.optional})
            </span>
          </FieldLabel>
          <Input
            id="contact-subject"
            name="subject"
            maxLength={160}
            aria-invalid={errorFor("subject") ? true : undefined}
          />
          <FieldError errors={errorFor("subject")} />
        </Field>
        <Field data-invalid={errorFor("body") ? true : undefined}>
          <FieldLabel htmlFor="contact-body">{labels.body}</FieldLabel>
          <Textarea
            id="contact-body"
            name="body"
            required
            minLength={10}
            maxLength={5000}
            rows={7}
            aria-invalid={errorFor("body") ? true : undefined}
          />
          <FieldError errors={errorFor("body")} />
        </Field>

        <div ref={turnstileContainer} />

        {state.status === "failed" && state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="pill"
          disabled={pending || !token}
          className="w-full sm:w-fit"
        >
          <Send aria-hidden="true" />
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
};

export default ContactForm;
