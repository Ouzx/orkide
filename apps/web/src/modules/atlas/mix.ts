import type { AtlasFamily } from "@orkide/validators/atlas";

/**
 * A mix of atlas specimens and the brief an agent builds it from. The first pick is the hero;
 * after it, aesthetics set the look and everything else supports. The brief is written for
 * agents, so it stays in English whatever the page's language (like the prompts it quotes).
 */
export interface MixPick {
  readonly id: string;
  readonly name: string;
  readonly family: AtlasFamily;
  readonly prompt: string;
}

export type MixRole = "hero" | "support" | "aesthetic";

export const roleOf = (pick: MixPick, index: number): MixRole => {
  if (index === 0) {
    return "hero";
  }
  return pick.family === "aesthetic" ? "aesthetic" : "support";
};

const ROLE_NAMES: Record<MixRole, string> = {
  aesthetic: "Aesthetic",
  hero: "Hero",
  support: "Support",
};

const GROUND_RULES =
  "Ground rules: the hero is the one big idea and the others support it. Key facts and the main call to action stay readable without any effect. Respect prefers-reduced-motion, pause animation off screen, keep it working at 400 px wide, and check text contrast on every background.";

/** The combined brief for `picks`, citing the atlas page at `atlasUrl`. */
export const brief = (picks: readonly MixPick[], atlasUrl: string): string =>
  [
    `Build a page for [subject] by mixing these design atlas specimens (${atlasUrl}):`,
    "",
    ...picks.map(
      (pick, index) =>
        `${index + 1}. ${ROLE_NAMES[roleOf(pick, index)]}: ${pick.name} (${pick.id}). ${pick.prompt}`
    ),
    "",
    GROUND_RULES,
  ].join("\n");

/** The mix in a link fragment (`#mix=GN-07,MO-03`), and back. */
export const mixHash = (ids: readonly string[]): string =>
  `#mix=${ids.join(",")}`;

export const parseMixHash = (hash: string): string[] | undefined => {
  const ids = /(?:^#|&)mix=(?<ids>[^&]*)/u.exec(hash)?.groups?.ids;
  return ids ? decodeURIComponent(ids).split(",").filter(Boolean) : undefined;
};
