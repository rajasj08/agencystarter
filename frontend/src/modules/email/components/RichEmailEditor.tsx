"use client";

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  TextStyle,
  Color,
  BackgroundColor,
  FontSize,
} from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "24px"] as const;
const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
];
const BG_COLORS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Light gray", value: "#f3f4f6" },
  { name: "Blue", value: "#dbeafe" },
];

export interface RichEmailEditorRef {
  insertAtCursor: (text: string) => void;
  /** Insert HTML at cursor (e.g. a link). */
  insertHtml: (html: string) => void;
  getHtml: () => string;
}

interface RichEmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Max width of the editor container (default 600px for email) */
  maxWidth?: string;
}

/** Link with class and style preserved so email CTA buttons render as buttons in the editor. */
const LinkWithAttrs = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("class"),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
      style: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
  }),
  TextStyle,
  Color,
  BackgroundColor,
  FontSize,
  Underline,
  LinkWithAttrs.configure({
    openOnClick: false,
    HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
  }),
];

/** Strip script and other unsafe tags; Tiptap already restricts input, this is a safety net for pasted content */
function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  const scripts = div.querySelectorAll("script, iframe, object, embed, form");
  scripts.forEach((el) => el.remove());
  return div.innerHTML;
}

export const RichEmailEditor = forwardRef<RichEmailEditorRef, RichEmailEditorProps>(
  function RichEmailEditor(
    { value, onChange, placeholder, className, maxWidth = "600px" },
    ref
  ) {
    const isInternalUpdate = useRef(false);
    const [, setSelectionUpdate] = useState(0);

    const editor = useEditor({
      extensions,
      content: value || "",
      editorProps: {
        attributes: {
          "data-placeholder": placeholder ?? "Write your email content…",
        },
      },
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        if (isInternalUpdate.current) return;
        const html = editor.getHTML();
        const normalized = html === "<p></p>" ? "" : html;
        onChange(sanitizeHtml(normalized));
      },
    });

    // Sync value from parent (e.g. reset to default, or initial load)
    useEffect(() => {
      if (!editor) return;
      const current = editor.getHTML();
      const normalizedCurrent = current === "<p></p>" ? "" : current;
      if (value !== normalizedCurrent) {
        isInternalUpdate.current = true;
        editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
        isInternalUpdate.current = false;
      }
    }, [editor, value]);

    // Re-render toolbar when selection/cursor changes so block type and format buttons stay in sync
    useEffect(() => {
      if (!editor) return;
      const onSelectionUpdate = () => setSelectionUpdate((n) => n + 1);
      editor.on("selectionUpdate", onSelectionUpdate);
      editor.on("transaction", onSelectionUpdate);
      return () => {
        editor.off("selectionUpdate", onSelectionUpdate);
        editor.off("transaction", onSelectionUpdate);
      };
    }, [editor]);

    const insertAtCursor = useCallback(
      (text: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(text).run();
      },
      [editor]
    );

    const insertHtml = useCallback(
      (html: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(html, { parseOptions: { preserveWhitespace: false } }).run();
      },
      [editor]
    );

    const getHtml = useCallback(() => {
      if (!editor) return "";
      const html = editor.getHTML();
      const normalized = html === "<p></p>" ? "" : html;
      return sanitizeHtml(normalized);
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({ insertAtCursor, insertHtml, getHtml }),
      [insertAtCursor, insertHtml, getHtml]
    );

    if (!editor) {
      return (
        <div
          className={`flex min-h-[280px] items-center justify-center rounded border border-border bg-muted/20 text-sm text-muted-foreground ${className ?? ""}`}
          style={{ maxWidth }}
        >
          Loading editor…
        </div>
      );
    }

    return (
      <div
        className={`rich-email-editor rounded border border-border bg-background ${className ?? ""}`}
        style={{ maxWidth }}
      >
        <style>{`
          .rich-email-editor .ProseMirror {
            --editor-block-spacing: 1em;
          }
          .rich-email-editor .ProseMirror h1 {
            margin: 0 0 0.4em;
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.3;
          }
          .rich-email-editor .ProseMirror h2 {
            margin: 0 0 0.4em;
            font-size: 1.125rem;
            font-weight: 600;
            line-height: 1.3;
          }
          .rich-email-editor .ProseMirror h3 {
            margin: 0 0 0.4em;
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.3;
          }
          .rich-email-editor .ProseMirror p {
            margin: 0 0 var(--editor-block-spacing);
          }
          .rich-email-editor .ProseMirror p:last-child {
            margin-bottom: 0;
          }
          .rich-email-editor .ProseMirror a.email-cta-button {
            display: inline-block;
            background: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
          }
        `}</style>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
          <select
            className="rounded border border-border bg-background px-2 py-1 text-xs font-medium"
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: parseInt(v.slice(1), 10) as 1 | 2 | 3 }).run();
            }}
            title="Block type"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <select
            className="rounded border border-border bg-background px-2 py-1 text-xs"
            value={editor.getAttributes("textStyle").fontSize ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontSize(v).run();
              else editor.chain().focus().unsetFontSize().run();
            }}
            title="Font size"
          >
            <option value="">Size</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-xs"
            value={editor.getAttributes("textStyle").color ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setColor(v).run();
              else editor.chain().focus().unsetColor().run();
            }}
            title="Text color"
          >
            {TEXT_COLORS.map((c) => (
              <option key={c.value || "default"} value={c.value}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-xs"
            value={editor.getAttributes("textStyle").backgroundColor ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setBackgroundColor(v).run();
              else editor.chain().focus().unsetBackgroundColor().run();
            }}
            title="Background color"
          >
            {BG_COLORS.map((c) => (
              <option key={c.value || "none"} value={c.value}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <ToolbarButton
            onClick={() => {
              const url = window.prompt("URL:");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive("link")}
            title="Link"
          >
            Link
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            1. List
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          className="min-h-[280px] [&_.ProseMirror]:min-h-[260px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:font-sans [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror_empty:before]:text-muted-foreground [&_.ProseMirror_empty:before]:content-[attr(data-placeholder)]"
        />
      </div>
    );
  }
);

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1.5 text-sm hover:bg-muted ${active ? "bg-muted font-medium" : ""}`}
    >
      {children}
    </button>
  );
}
