import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Heading, Section, Text } from "react-email";

import { Layout } from "../layout.tsx";

export interface ContactAcknowledgementProps {
  readonly locale: Locale;
  readonly name: string;
  readonly body: string;
  readonly siteUrl: string;
}

/** Sent to the visitor, in their language, confirming their message arrived. */
export const ContactAcknowledgement = ({
  locale,
  name,
  body,
  siteUrl,
}: ContactAcknowledgementProps) => {
  const options = { locale };
  return (
    <Layout
      locale={locale}
      preview={m.email_contact_ack_preview({}, options)}
      siteUrl={siteUrl}
    >
      <Heading as="h1" className="text-ink m-0 mb-4 text-2xl font-semibold">
        {m.email_contact_ack_heading({}, options)}
      </Heading>
      <Text className="text-ink text-base leading-6.5">
        {m.email_contact_ack_body({ name }, options)}
      </Text>
      <Section className="bg-panel mt-4 rounded-md border-l-4 border-none border-solid border-accent px-4 py-2">
        <Text className="m-0 text-xs font-semibold tracking-wide text-muted uppercase">
          {m.email_contact_ack_copy_label({}, options)}
        </Text>
        <Text className="text-ink text-base leading-6 whitespace-pre-wrap">
          {body}
        </Text>
      </Section>
    </Layout>
  );
};

ContactAcknowledgement.PreviewProps = {
  body: "Hi! I would love to talk about a project on Cloudflare Workers.",
  locale: "tr",
  name: "Ada",
  siteUrl: "https://orkide-web.ouzx.workers.dev",
} satisfies ContactAcknowledgementProps;

export default ContactAcknowledgement;
