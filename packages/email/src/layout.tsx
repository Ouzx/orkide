import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "react-email";

export interface LayoutProps {
  readonly locale: Locale;
  readonly preview: string;
  readonly siteUrl: string;
  readonly children: ReactNode;
}

/**
 * Shared shell for every Orkide email: a single centered column, pixel-based Tailwind (email
 * clients do not support `rem`), WCAG AA contrast and the locale on `<html lang>`.
 */
export const Layout = ({ locale, preview, siteUrl, children }: LayoutProps) => (
  <Html dir="ltr" lang={locale}>
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
        theme: {
          extend: {
            // The skin's white print (packages/ui/src/tokens/tokens.json): email clients take
            // no custom properties, so the values are copied here.
            colors: {
              accent: "#b23519",
              canvas: "#f2f5f9",
              ink: "#0d3a73",
              muted: "#4a6892",
              panel: "#e4eaf3",
              rule: "#c6d3e5",
            },
          },
        },
      }}
    >
      <Head />
      <Body className="bg-canvas m-0 font-sans">
        <Preview>{preview}</Preview>
        <Container className="border-rule mx-auto my-8 max-w-[560px] overflow-hidden border border-solid bg-white">
          {/* Hosted by the web Worker (`pnpm media`): email clients only load absolute URLs. */}
          <Img
            src={`${siteUrl}/media/email-header.jpg`}
            width="560"
            height="140"
            alt={m.site_name({}, { locale })}
            className="block h-auto w-full"
          />
          <Section className="px-8 py-6">
            <Section>{children}</Section>
            <Hr className="border-rule my-6 border-solid" />
            <Text className="m-0 text-xs text-muted">
              {m.email_footer(
                { siteName: m.site_name({}, { locale }), siteUrl },
                { locale }
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
