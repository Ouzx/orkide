import type { Extensions } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { StarterKit } from "@tiptap/starter-kit";

/** URL schemes a link may use. Anything else (e.g. `javascript:`) is dropped. */
export const ALLOWED_LINK_PROTOCOLS = ["http", "https", "mailto"] as const;

/**
 * Whether `href` is a relative URL or uses an allowed scheme. The editor (link creation and
 * paste) and the server-side validators apply this same rule.
 */
export const isSafeHref = (href: unknown): boolean => {
  if (typeof href !== "string") {
    return false;
  }
  if (href.startsWith("/") || href.startsWith("#")) {
    return true;
  }
  const protocol = URL.parse(href)?.protocol.slice(0, -1);
  return (
    protocol !== undefined &&
    (ALLOWED_LINK_PROTOCOLS as readonly string[]).includes(protocol)
  );
};

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
        // `dataset` is absent from the Workers DOM typings this module is also compiled against.
        // oxlint-disable-next-line unicorn/prefer-dom-node-dataset
        parseHTML: (element) => element.getAttribute("data-media-id"),
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
      // http/https/mailto are linkify built-ins; registering them again warns per editor.
      isAllowedUri: (url) => isSafeHref(url),
      openOnClick: false,
    },
  }),
  MediaImage,
];
