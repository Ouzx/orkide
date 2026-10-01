import { m } from "@orkide/i18n/messages";
import { render } from "@react-email/render";
import { createElement } from "react";

import { ContactAcknowledgement } from "./templates/contact-acknowledgement.tsx";
import type { ContactAcknowledgementProps } from "./templates/contact-acknowledgement.tsx";
import { ContactNotification } from "./templates/contact-notification.tsx";
import type { ContactNotificationProps } from "./templates/contact-notification.tsx";

/** A provider-agnostic, fully rendered email. */
export interface RenderedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

const renderBoth = async (element: React.ReactElement) => {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
};

/**
 * Every email the system sends, keyed by name. Each entry turns typed props into subject + HTML +
 * plain text (the plain-text part is required for accessibility and deliverability).
 */
export const emails = {
  contactAcknowledgement: async (
    props: ContactAcknowledgementProps
  ): Promise<RenderedEmail> => ({
    subject: m.email_contact_ack_subject(
      { name: props.name },
      { locale: props.locale }
    ),
    ...(await renderBoth(createElement(ContactAcknowledgement, props))),
  }),
  contactNotification: async (
    props: ContactNotificationProps
  ): Promise<RenderedEmail> => ({
    subject: m.email_contact_notify_subject(
      { name: props.name },
      { locale: props.locale }
    ),
    ...(await renderBoth(createElement(ContactNotification, props))),
  }),
} as const;

export type EmailName = keyof typeof emails;
export type { ContactAcknowledgementProps } from "./templates/contact-acknowledgement.tsx";
export type { ContactNotificationProps } from "./templates/contact-notification.tsx";
