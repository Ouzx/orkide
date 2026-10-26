import { atlasFamilies } from "@orkide/validators/atlas";
import { describe, expect, it } from "vitest";

import { buildAtlasJson } from "./atlas-json.ts";
import { catalog, familyCounts, specimenFiles } from "./catalog.ts";

/** Every specimen module, and every specimen stylesheet as text. */
const modules = import.meta.glob<Record<string, unknown>>("./specimens/*.ts", {
  eager: true,
});
const sheets = import.meta.glob<string>("./specimens/*.css", {
  eager: true,
  import: "default",
  query: "?raw",
});
const slugOf = (path: string) =>
  path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf("."));
const slugs = new Set(catalog.map((specimen) => specimen.slug));

/** What in a specimen's stylesheet reaches outside its own stage. */
const outsideStage = (path: string, source: string): string[] => {
  const slug = slugOf(path);
  if (!slugs.has(slug)) {
    return [`${path} has no specimen`];
  }
  const prefix = `st-${slug}`;
  const css = source.replaceAll(/\/\*[\s\S]*?\*\//gu, "");
  // These sheets come first on the page: a layer named here would fix the layers' order before
  // the global stylesheet does, and the base layer would beat the kit.
  const layered = css.includes("@layer") ? [`${path}: uses @layer`] : [];
  // Class selectors (a dot then a letter, so not decimals like `.5s`), then keyframe names.
  const classes = [...css.matchAll(/\.(?<name>-?[a-z][\w-]*)/gu)]
    .map((match) => match.groups?.name ?? "")
    .filter((name) => !name.startsWith(prefix))
    .map((name) => `${path}: .${name}`);
  const keyframes = [...css.matchAll(/@keyframes\s+(?<name>[\w-]+)/gu)]
    .map((match) => match.groups?.name ?? "")
    .filter((name) => !name.startsWith(`${prefix}-`))
    .map((name) => `${path}: @keyframes ${name}`);
  return [...layered, ...classes, ...keyframes];
};

describe("atlas catalog", () => {
  it("names every file after its specimen's slug", () => {
    const misnamed = [...specimenFiles].filter(
      ([slug, path]) => slugOf(path) !== slug
    );
    expect(misnamed).toStrictEqual([]);
  });

  it("gives every specimen a preview", () => {
    const missing = Object.entries(modules)
      .filter(([, module]) => typeof module.preview !== "function")
      .map(([path]) => path);
    expect(missing).toStrictEqual([]);
  });

  it("has every family and lists the catalog in family order", () => {
    const counts = familyCounts();
    expect(
      atlasFamilies.filter((family) => counts[family] === 0)
    ).toStrictEqual([]);
    const order = catalog.map((specimen) =>
      atlasFamilies.indexOf(specimen.family)
    );
    expect(order).toStrictEqual(order.toSorted((a, b) => a - b));
  });

  it("keeps each stylesheet inside its own stage", () => {
    const outside = Object.entries(sheets).flatMap(([path, source]) =>
      outsideStage(path, source)
    );
    expect(outside).toStrictEqual([]);
  });

  it("serves the whole catalog to agents in English, with absolute links", () => {
    const json = buildAtlasJson();
    expect(json.specimens).toHaveLength(catalog.length);
    const unlinked = json.specimens.filter(
      (specimen) => !/^https:\/\/.+\/en\/atlas#[a-z0-9-]+$/u.test(specimen.url)
    );
    expect(unlinked).toStrictEqual([]);
  });
});
