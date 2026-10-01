import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Button, Heading, Section, Text } from "react-email";

import { Layout } from "../layout.tsx";

export interface ContactNotificationProps {
  /** Language of the site owner's inbox. */
  readonly locale: Locale;
  readonly name: string;
  readonly email: string;
  readonly subject: string | null;
  readonly body: string;
  /** Language the visitor wrote from. */
  readonly senderLocale: Locale;
  readonly siteUrl: string;
}

/** Sent to the site owner for every new contact message. */
export const ContactNotification = (props: ContactNotificationProps) => {
  const { locale, name, email, subject, body, senderLocale, siteUrl } = props;
  const options = { locale };
  return (
    <Layout
      locale={locale}
      preview={subject ?? body.slice(0, 90)}
      siteUrl={siteUrl}
    >
      <Heading as="h1" className="text-ink m-0 mb-4 text-2xl font-semibold">
        {m.email_contact_notify_heading({}, options)}
      </Heading>
      <Text className="m-0 text-sm text-muted">
        {name} &lt;{email}&gt; · {senderLocale.toUpperCase()}
      </Text>
      {subject ? (
        <Text className="text-ink text-base font-semibold">{subject}</Text>
      ) : null}
      <Section className="bg-panel rounded-md px-4 py-2">
        <Text className="text-ink text-base leading-6 whitespace-pre-wrap">
          {body}
        </Text>
      </Section>
      <Button
        className="mt-6 box-border block rounded-md bg-accent px-5 py-3 text-center text-base font-semibold text-white no-underline"
        href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject ?? ""}`.trim())}`}
      >
        {m.email_contact_notify_reply({ name }, options)}
      </Button>
    </Layout>
  );
};

ContactNotification.PreviewProps = {
  body: "Hi! I would love to talk about a project on Cloudflare Workers.",
  email: "ada@example.com",
  locale: "en",
  name: "Ada",
  senderLocale: "tr",
  siteUrl: "https://orkide-web.ouzx.workers.dev",
  subject: "Collaboration",
} satisfies ContactNotificationProps;

export default ContactNotification;
