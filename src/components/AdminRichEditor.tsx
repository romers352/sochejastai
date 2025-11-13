"use client";
import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

type AdminRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export default function AdminRichEditor({ value, onChange }: AdminRichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync if parent value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('bold')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('bold') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">B</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('italic')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('italic') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><span style={{ fontStyle: "italic" }}>I</span></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('underline')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('underline') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline"><span style={{ textDecoration: "underline" }}>U</span></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('strike')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('strike') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough"><span style={{ textDecoration: "line-through" }}>S</span></button>
        <span className="mx-2 inline-block w-px bg-black/20" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('bulletList')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('bulletList') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bulleted List">• List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('orderedList')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('orderedList') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered List">1. List</button>
        <span className="mx-2 inline-block w-px bg-black/20" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('paragraph')} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('paragraph') ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().setParagraph().run()}>Paragraph</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('heading', { level: 1 })} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('heading', { level: 1 }) ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('heading', { level: 2 })} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('heading', { level: 2 }) ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive('heading', { level: 3 })} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive('heading', { level: 3 }) ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="mx-2 inline-block w-px bg-black/20" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive({ textAlign: 'left' })} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive({ textAlign: 'left' }) ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().setTextAlign("left").run()} aria-label="Align left">Left</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive({ textAlign: 'center' })} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive({ textAlign: 'center' }) ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().setTextAlign("center").run()} aria-label="Align center">Center</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} aria-pressed={editor.isActive({ textAlign: 'right' })} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${editor.isActive({ textAlign: 'right' }) ? 'bg-black text-white' : ''}`} onClick={() => editor.chain().focus().setTextAlign("right").run()} aria-label="Align right">Right</button>
        <span className="mx-2 inline-block w-px bg-black/20" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => {
          const url = window.prompt("Link URL");
          if (!url) { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }} aria-label="Link">Link</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => {
          const url = window.prompt("Image URL");
          if (!url) return;
          editor.chain().focus().setImage({ src: url }).run();
        }} aria-label="Image">Image</button>
        <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
          <span className="text-black/70">Text Color</span>
          <input type="color" aria-label="Text color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
        </label>
        <span className="mx-2 inline-block w-px bg-black/20" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => editor.chain().focus().unsetAllMarks().setParagraph().run()} aria-label="Clear">Clear</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => editor.chain().focus().undo().run()} aria-label="Undo">Undo</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => editor.chain().focus().redo().run()} aria-label="Redo">Redo</button>
      </div>

      <div className="prose prose-sm w-full rounded-md border border-black/20 px-3 py-2 text-sm min-h-[220px] outline-none">
        <EditorContent editor={editor} />
      </div>

      <style jsx>{`
        .tiptap-editor .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .tiptap-editor .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        .tiptap-editor .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
        .tiptap-editor .ProseMirror img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}