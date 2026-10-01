import type { Locale } from "@orkide/i18n";

declare global {
  namespace App {
    interface Locals {
      /** Locale of the current request, resolved from the URL by the i18n middleware. */
      locale: Locale;
    }
  }

  /**
   * This project type-checks Worker and browser code together. The Workers runtime types declare
   * HTMLRewriter's `Element.append(content, options)` directly on `Element`, which hides the DOM's
   * `ParentNode.append(...nodes)`; merging the DOM signature back keeps both usable.
   */
  interface Element {
    // A method signature merges as an extra overload; a property signature would conflict.
    // oxlint-disable-next-line typescript/method-signature-style
    append(...nodes: (Node | string)[]): void;
  }
}
