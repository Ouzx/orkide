import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
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
            colors: {
              accent: "#7c3aed",
              canvas: "#f1f5f9",
              ink: "#0f172a",
              muted: "#475569",
              panel: "#f8fafc",
              rule: "#e2e8f0",
            },
          },
        },
      }}
    >
      <Head />
      <Body className="bg-canvas m-0 font-sans">
        <Preview>{preview}</Preview>
        <Container className="mx-auto my-8 max-w-[560px] rounded-lg bg-white px-8 py-6">
          <Section>{children}</Section>
          <Hr className="border-rule my-6 border-solid" />
          <Text className="text-muted m-0 text-xs">
            {m.email_footer(
              { siteName: m.site_name({}, { locale }), siteUrl },
              { locale }
            )}
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
