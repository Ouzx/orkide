import type { AtlasFamily } from "@orkide/validators/atlas";

import { motionAllowed, viewTransition } from "@/shared/motion/motion.ts";

import { brief, mixHash, parseMixHash, roleOf } from "./mix.ts";
import type { MixPick } from "./mix.ts";

/**
 * The atlas's controls: family chips and search filter the plates (chips morph them into place),
 * Pick adds a specimen to the mix, and the tray orders the mix (its first pick is the hero) and
 * copies a link to it or the brief for an agent. The mix lives in this browser only (and in a
 * copied link's fragment), so the page stays the same for every visitor.
 */
const STORAGE_KEY = "orkide-atlas-mix";
const root = document.documentElement;
const cards = [...document.querySelectorAll<HTMLElement>("[data-spec]")];
const byId = new Map(cards.map((card) => [card.dataset.spec ?? "", card]));
const bar = document.querySelector<HTMLElement>("[data-atlas-bar]");
const chips = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-family-filter]"),
];
const search = document.querySelector<HTMLInputElement>("[data-atlas-search]");
const empty = document.querySelector<HTMLElement>("[data-atlas-empty]");
const tray = document.querySelector<HTMLElement>("[data-atlas-tray]");
const list = tray?.querySelector<HTMLElement>("[data-mix-list]");
const count = tray?.querySelector<HTMLElement>("[data-mix-count]");
const template = document.querySelector<HTMLTemplateElement>(
  "template[data-mix-item]"
);

const known = (ids: readonly string[]) =>
  ids.filter((id, index) => byId.has(id) && ids.indexOf(id) === index);

const readStored = (): string[] => {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    return Array.isArray(stored)
      ? stored.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

let mix = known(parseMixHash(location.hash) ?? readStored());
let family = "all";
let query = "";

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mix));
  } catch {
    // Storage can be unavailable (private mode): the mix lasts for the page.
  }
};

const pickOf = (id: string): MixPick | undefined => {
  const card = byId.get(id);
  if (!card) {
    return undefined;
  }
  return {
    // Rendered from the validated catalog (no schema ships to the browser).
    family: card.dataset.family as AtlasFamily,
    id,
    name: card.dataset.name ?? id,
    prompt: card.querySelector("[data-prompt]")?.textContent?.trim() ?? "",
  };
};

/* ── Filters ─────────────────────────────────────────────────────────────────────────────── */
const matches = (card: HTMLElement) =>
  (family === "all" || card.dataset.family === family) &&
  (query === "" || (card.dataset.search ?? "").includes(query));

const filter = () => {
  let shown = 0;
  for (const card of cards) {
    card.hidden = !matches(card);
    shown += card.hidden ? 0 : 1;
  }
  if (empty) {
    empty.hidden = shown > 0;
  }
};

const onScreen = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.bottom > 0 && box.top < innerHeight;
};

/** Plates on screen glide to their new places; the rest of the page holds still. */
const morph = async (update: () => void) => {
  if (!("startViewTransition" in document && motionAllowed())) {
    update();
    return;
  }
  const named = cards.filter((card) => !card.hidden && onScreen(card));
  for (const card of named) {
    card.style.viewTransitionName = `o-spec-${card.id}`;
  }
  root.classList.add("o-filtering");
  try {
    await viewTransition(update).finished;
  } catch {
    // Skipped by a quicker second filter: its update already ran.
  } finally {
    root.classList.remove("o-filtering");
    for (const card of named) {
      card.style.viewTransitionName = "";
    }
  }
};

const choose = (chip: HTMLButtonElement) => {
  family = chip.dataset.familyFilter ?? "all";
  for (const other of chips) {
    other.setAttribute("aria-pressed", String(other === chip));
  }
  void morph(filter);
};

for (const chip of chips) {
  chip.addEventListener("click", () => choose(chip));
}

search?.addEventListener("input", () => {
  query = search.value.trim().toLocaleLowerCase(root.lang || undefined);
  filter();
});

/* ── The mix ─────────────────────────────────────────────────────────────────────────────── */
/** Whether a card pairs with the mix: it names a pick, or a pick names it. */
const pairsWithMix = (card: HTMLElement, picks: ReadonlySet<string>) => {
  const id = card.dataset.spec ?? "";
  const own = new Set((card.dataset.pairs ?? "").split(" "));
  return [...picks].some(
    (picked) =>
      own.has(picked) ||
      new Set((byId.get(picked)?.dataset.pairs ?? "").split(" ")).has(id)
  );
};

const roleName = (role: string) =>
  tray?.dataset[`role${role[0]?.toUpperCase() ?? ""}${role.slice(1)}`] ?? role;

const renderTray = () => {
  if (!(tray && list && template)) {
    return;
  }
  tray.hidden = mix.length === 0;
  if (count && count.textContent !== String(mix.length)) {
    count.textContent = String(mix.length);
    delete count.dataset.flip;
    count.getBoundingClientRect();
    count.dataset.flip = "";
  }
  const items = mix.flatMap((id, index) => {
    const pick = pickOf(id);
    const item = template.content.firstElementChild?.cloneNode(true);
    if (!(pick && item instanceof HTMLElement)) {
      return [];
    }
    const role = roleOf(pick, index);
    item.dataset.id = id;
    item.dataset.role = role;
    const roleLabel = item.querySelector("[data-mix-role]");
    const name = item.querySelector("[data-mix-name]");
    if (roleLabel) {
      roleLabel.textContent = roleName(role);
    }
    if (name) {
      name.textContent = `${id} · ${byId.get(id)?.querySelector("h3")?.textContent ?? pick.name}`;
    }
    return [item];
  });
  list.replaceChildren(...items);
};

const render = () => {
  const picks = new Set(mix);
  for (const card of cards) {
    const picked = picks.has(card.dataset.spec ?? "");
    card.toggleAttribute("data-picked", picked);
    card.toggleAttribute(
      "data-pairs-mix",
      !picked && pairsWithMix(card, picks)
    );
    card
      .querySelector("[data-pick]")
      ?.setAttribute("aria-pressed", String(picked));
    const stamp = card.querySelector<HTMLElement>(".o-spec-stamp");
    if (stamp) {
      stamp.hidden = !picked;
    }
  }
  renderTray();
  save();
};

const toggle = (id: string) => {
  mix = mix.includes(id) ? mix.filter((other) => other !== id) : [...mix, id];
  render();
};

for (const card of cards) {
  const pick = card.querySelector<HTMLButtonElement>("[data-pick]");
  if (pick) {
    pick.hidden = false;
    pick.addEventListener("click", () => toggle(card.dataset.spec ?? ""));
  }
}

list?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const id = target?.closest<HTMLElement>("[data-id]")?.dataset.id;
  if (!id) {
    return;
  }
  if (target?.closest("[data-mix-remove]")) {
    toggle(id);
  } else if (target?.closest("[data-mix-lead]")) {
    mix = [id, ...mix.filter((other) => other !== id)];
    render();
  }
});

tray?.querySelector("[data-mix-clear]")?.addEventListener("click", () => {
  mix = [];
  render();
});

/* ── Copying ─────────────────────────────────────────────────────────────────────────────── */
/** A copy button: shown only where the clipboard works; says so for a moment when it did. */
const copier = (button: HTMLButtonElement | null, text: () => string) => {
  if (!(button && navigator.clipboard)) {
    return;
  }
  button.hidden = false;
  const label = button.textContent;
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(text());
    button.textContent = button.dataset.copied ?? label;
    button.dataset.done = "";
    setTimeout(() => {
      button.textContent = label;
      delete button.dataset.done;
    }, 1600);
  });
};

for (const card of cards) {
  copier(
    card.querySelector<HTMLButtonElement>("[data-copy-prompt]"),
    () => card.querySelector("[data-prompt]")?.textContent?.trim() ?? ""
  );
}
const atlasUrl = `${location.origin}${location.pathname}`;
copier(
  tray?.querySelector<HTMLButtonElement>("[data-mix-link]") ?? null,
  () => `${atlasUrl}${mixHash(mix)}`
);
copier(tray?.querySelector<HTMLButtonElement>("[data-mix-brief]") ?? null, () =>
  brief(
    mix.flatMap((id) => pickOf(id) ?? []),
    atlasUrl
  )
);

if (bar) {
  bar.hidden = false;
}
render();
