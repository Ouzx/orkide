import type { Extensions } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { StarterKit } from "@tiptap/starter-kit";

/** URL schemes a link may use. Anything else (e.g. `javascript:`) is dropped. */
export const ALLOWED_LINK_PROTOCOLS = ["http", "https", "mailto"] as const;

/**
 * Image node backed by the media library: besides `src`/`alt` it keeps the `mediaId` so renders
 * can resolve responsive variants and localized alt text, plus intrinsic dimensions to avoid CLS.
 */
export const MediaImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      height: { default: null },
      mediaId: {
        default: null,
        parseHTML: (element) => element.dataset.mediaId,
        renderHTML: (attributes: { mediaId?: string | null }) =>
          attributes.mediaId ? { "data-media-id": attributes.mediaId } : {},
      },
      width: { default: null },
    };
  },
}).configure({ allowBase64: false, inline: false });

/**
 * The single extension set shared by the admin editor and every server-side renderer.
 * Editing and rendering with different sets would silently drop content, so both import this.
 */
export const contentExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: {
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      autolink: true,
      defaultProtocol: "https",
      openOnClick: false,
      protocols: [...ALLOWED_LINK_PROTOCOLS],
    },
  }),
  MediaImage,
];
