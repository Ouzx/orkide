import { contentExtensions } from "@orkide/content/extensions";
import { m } from "@orkide/i18n/messages";
import { Button } from "@orkide/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@orkide/ui/components/dialog";
import { Input } from "@orkide/ui/components/input";
import { Toggle } from "@orkide/ui/components/toggle";
import type { DocumentTranslationInput } from "@orkide/validators/content";
import type { Media } from "@orkide/validators/media";
import { Placeholder } from "@tiptap/extensions";
import { Tiptap, useEditor, useTiptap, useTiptapState } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/react";
import {
  Bold,
  Code,
  Code2,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { ComponentType, FormEvent } from "react";

import { useAdmin } from "../context.tsx";

/** The editor's value: a translation's Tiptap document (derived from the validators). */
export type RichTextDocument = DocumentTranslationInput["content"];

const isDocument = (json: JSONContent): json is RichTextDocument =>
  json.type === "doc";

interface ToolbarState {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly strike: boolean;
  readonly code: boolean;
  readonly h2: boolean;
  readonly h3: boolean;
  readonly h4: boolean;
  readonly bulletList: boolean;
  readonly orderedList: boolean;
  readonly blockquote: boolean;
  readonly codeBlock: boolean;
  readonly link: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

const selectState = ({ editor }: { editor: Editor }): ToolbarState => ({
  blockquote: editor.isActive("blockquote"),
  bold: editor.isActive("bold"),
  bulletList: editor.isActive("bulletList"),
  canRedo: editor.can().redo(),
  canUndo: editor.can().undo(),
  code: editor.isActive("code"),
  codeBlock: editor.isActive("codeBlock"),
  h2: editor.isActive("heading", { level: 2 }),
  h3: editor.isActive("heading", { level: 3 }),
  h4: editor.isActive("heading", { level: 4 }),
  italic: editor.isActive("italic"),
  link: editor.isActive("link"),
  orderedList: editor.isActive("orderedList"),
  strike: editor.isActive("strike"),
});

const ToolButton = ({
  icon: Icon,
  label,
  pressed,
  onPress,
  disabled = false,
}: {
  readonly icon: ComponentType<{ className?: string }>;
  readonly label: string;
  readonly pressed?: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
}) => (
  <Toggle
    size="sm"
    aria-label={label}
    title={label}
    pressed={pressed ?? false}
    onPressedChange={onPress}
    disabled={disabled}
  >
    <Icon className="size-4" />
  </Toggle>
);

const LinkDialog = ({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) => {
  const { editor } = useTiptap();
  const { options } = useAdmin();
  const id = useId();
  const current = editor.getAttributes("link").href as string | undefined;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = String(
      new FormData(event.currentTarget).get("href") ?? ""
    ).trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    (href ? chain.setLink({ href }) : chain.unsetLink()).run();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{m.admin_editor_link({}, options)}</DialogTitle>
          </DialogHeader>
          <label htmlFor={id} className="sr-only">
            {m.admin_editor_link_prompt({}, options)}
          </label>
          <Input
            id={id}
            name="href"
            type="url"
            defaultValue={current ?? ""}
            placeholder="https://"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {m.admin_editor_link_prompt({}, options)}
          </p>
          <DialogFooter>
            <Button type="submit">{m.admin_save({}, options)}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Toolbar = ({
  onRequestImage,
}: {
  readonly onRequestImage?: () => Promise<Media | undefined>;
}) => {
  const { editor } = useTiptap();
  const { options } = useAdmin();
  const state = useTiptapState(selectState);
  const [linkOpen, setLinkOpen] = useState(false);
  const run = () => editor.chain().focus();

  const insertImage = async () => {
    const media = await onRequestImage?.();
    if (!media) {
      return;
    }
    run()
      .insertContent({
        attrs: {
          alt: media.alt,
          height: media.height,
          mediaId: media.id,
          src: `${media.url}?w=1280`,
          width: media.width,
        },
        type: "image",
      })
      .run();
  };

  return (
    <div
      role="toolbar"
      aria-label={m.admin_editor_toolbar({}, options)}
      className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 border-b glass p-1.5 lg:top-0"
    >
      <ToolButton
        icon={Bold}
        label={m.admin_editor_bold({}, options)}
        pressed={state.bold}
        onPress={() => run().toggleBold().run()}
      />
      <ToolButton
        icon={Italic}
        label={m.admin_editor_italic({}, options)}
        pressed={state.italic}
        onPress={() => run().toggleItalic().run()}
      />
      <ToolButton
        icon={Strikethrough}
        label={m.admin_editor_strike({}, options)}
        pressed={state.strike}
        onPress={() => run().toggleStrike().run()}
      />
      <ToolButton
        icon={Code}
        label={m.admin_editor_code({}, options)}
        pressed={state.code}
        onPress={() => run().toggleCode().run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolButton
        icon={Heading2}
        label={m.admin_editor_heading({ level: "2" }, options)}
        pressed={state.h2}
        onPress={() => run().toggleHeading({ level: 2 }).run()}
      />
      <ToolButton
        icon={Heading3}
        label={m.admin_editor_heading({ level: "3" }, options)}
        pressed={state.h3}
        onPress={() => run().toggleHeading({ level: 3 }).run()}
      />
      <ToolButton
        icon={Heading4}
        label={m.admin_editor_heading({ level: "4" }, options)}
        pressed={state.h4}
        onPress={() => run().toggleHeading({ level: 4 }).run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolButton
        icon={List}
        label={m.admin_editor_bullet_list({}, options)}
        pressed={state.bulletList}
        onPress={() => run().toggleBulletList().run()}
      />
      <ToolButton
        icon={ListOrdered}
        label={m.admin_editor_ordered_list({}, options)}
        pressed={state.orderedList}
        onPress={() => run().toggleOrderedList().run()}
      />
      <ToolButton
        icon={Quote}
        label={m.admin_editor_quote({}, options)}
        pressed={state.blockquote}
        onPress={() => run().toggleBlockquote().run()}
      />
      <ToolButton
        icon={Code2}
        label={m.admin_editor_code_block({}, options)}
        pressed={state.codeBlock}
        onPress={() => run().toggleCodeBlock().run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolButton
        icon={Link2}
        label={m.admin_editor_link({}, options)}
        pressed={state.link}
        onPress={() => setLinkOpen(true)}
      />
      {onRequestImage ? (
        <ToolButton
          icon={ImageIcon}
          label={m.admin_editor_image({}, options)}
          onPress={insertImage}
        />
      ) : null}
      <span className="ml-auto flex">
        <ToolButton
          icon={Undo2}
          label={m.admin_editor_undo({}, options)}
          disabled={!state.canUndo}
          onPress={() => run().undo().run()}
        />
        <ToolButton
          icon={Redo2}
          label={m.admin_editor_redo({}, options)}
          disabled={!state.canRedo}
          onPress={() => run().redo().run()}
        />
      </span>
      <LinkDialog open={linkOpen} onOpenChange={setLinkOpen} />
    </div>
  );
};

/**
 * Rich-text editor (Tiptap, Composable API: the toolbar reads the editor from context).
 * It uses the exact `contentExtensions` the server renders with, so whatever the editor can
 * produce, the site can publish — and nothing else.
 */
export const RichTextEditor = ({
  value,
  onChange,
  onRequestImage,
  labelledBy,
  editable = true,
}: {
  readonly value: RichTextDocument;
  readonly onChange: (document: RichTextDocument) => void;
  readonly onRequestImage?: () => Promise<Media | undefined>;
  readonly labelledBy?: string;
  /** Read-only when false: no toolbar, no edits (the user lacks write permission). */
  readonly editable?: boolean;
}) => {
  const { options } = useAdmin();
  const editor = useEditor({
    content: value,
    editable,
    editorProps: {
      attributes: {
        "aria-labelledby": labelledBy ?? "",
        "aria-multiline": "true",
        "aria-readonly": String(!editable),
        class: "prose-orkide min-h-80 px-6 py-5 outline-none",
        role: "textbox",
      },
    },
    extensions: [
      ...contentExtensions,
      Placeholder.configure({
        placeholder: m.admin_editor_placeholder({}, options),
      }),
    ],
    onUpdate: ({ editor: current }) => {
      const json = current.getJSON();
      if (isDocument(json)) {
        onChange(json);
      }
    },
  });

  // `useEditor` re-applies options on re-render but deliberately keeps the editor's current
  // `editable` state, so changes to the prop must be pushed explicitly (without an update event).
  useEffect(() => {
    if (editor.isEditable !== editable) {
      editor.setEditable(editable, false);
    }
  }, [editor, editable]);

  return (
    <div className="overflow-hidden rounded-2xl border glass focus-within:ring-2 focus-within:ring-ring">
      <Tiptap editor={editor}>
        {editable ? <Toolbar onRequestImage={onRequestImage} /> : null}
        <Tiptap.Content />
      </Tiptap>
    </div>
  );
};
