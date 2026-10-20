import type { Locale } from "@orkide/i18n";

declare global {
  interface ImportMetaEnv {
    /** Short commit of this build (`astro.config.ts`), the title block's revision. */
    readonly PUBLIC_BUILD: string;
    /** The build's last commits, newest first (`astro.config.ts`): the revision table. */
    readonly PUBLIC_REVISIONS: readonly {
      readonly date: string;
      readonly hash: string;
      readonly subject: string;
    }[];
  }

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
