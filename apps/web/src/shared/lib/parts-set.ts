/**
 * A drawing and its parts list wrapped in `[data-parts-set]`: pointing at or focusing a part
 * (`data-part`), a balloon (`data-balloon`) or a row of the list (`data-part`) lights every element
 * with the same number (`data-on`, styled by kit.css). It informs, so it runs with motion off too.
 */
export const linkPartsSets = (): void => {
  for (const set of document.querySelectorAll<HTMLElement>(
    "[data-parts-set]"
  )) {
    const light = (id?: string) => {
      for (const part of set.querySelectorAll<HTMLElement | SVGElement>(
        "[data-part], [data-balloon]"
      )) {
        part.toggleAttribute(
          "data-on",
          id !== undefined && (part.dataset.part ?? part.dataset.balloon) === id
        );
      }
    };
    const pick = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const part = target?.closest<HTMLElement | SVGElement>(
        "[data-part], [data-balloon]"
      );
      light(part ? (part.dataset.part ?? part.dataset.balloon) : undefined);
    };
    set.addEventListener("pointerover", pick);
    set.addEventListener("focusin", pick);
    set.addEventListener("pointerleave", () => light());
    set.addEventListener("focusout", () => light());
  }
};
