"use client";
import React, { useEffect, useRef, useId } from "react";
import "quill/dist/quill.snow.css";

type AdminQuillEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
};

export default function AdminQuillEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  readOnly = false,
  className,
}: AdminQuillEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const lastHtmlFromQuillRef = useRef<string>("");
  const rawId = useId();
  const toolbarId = `ql-${String(rawId).replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!editorRef.current || !toolbarRef.current) return;
      const { default: Quill } = await import("quill");

      if (!isMounted) return;
      const q = new Quill(editorRef.current!, {
        theme: "snow",
        readOnly,
        placeholder,
        modules: {
          toolbar: `#${toolbarId}`,
          history: { delay: 400, maxStack: 200 },
        },
        formats: [
          "bold",
          "italic",
          "underline",
          "strike",
          "color",
          "background",
          "header",
          "font",
          "size",
          "align",
          "list",
          "indent",
          "link",
          "image",
          "blockquote",
          "code-block",
        ],
      });

      quillRef.current = q;

      // Initial content
      if (value) {
        const Delta = q.clipboard.convert({ html: value });
        q.setContents(Delta);
      }

      q.on("text-change", () => {
        const html = q.root.innerHTML;
        lastHtmlFromQuillRef.current = html;
        onChangeRef.current?.(html);
      });
    })();

    return () => {
      isMounted = false;
      quillRef.current = null;
      if (editorRef.current) editorRef.current.innerHTML = "";
    };
  }, [placeholder, readOnly, toolbarId]);

  // Sync external value changes
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const current = q.root.innerHTML;
    // Only update if value changed externally, not from Quill itself
    if (value !== current && value !== lastHtmlFromQuillRef.current) {
      const sel = q.getSelection();
      const Delta = q.clipboard.convert({ html: value || "" });
      q.setContents(Delta);
      if (sel) q.setSelection(sel.index, sel.length);
    }
  }, [value]);

  return (
    <div className={className}>
      {/* Toolbar */}
      <div
        id={toolbarId}
        ref={toolbarRef}
        className="quill-toolbar mb-2 flex flex-wrap items-center gap-2 text-sm"
        style={{ padding: 8, border: "1px solid #e5e7eb", borderBottom: "none", background: "#fafafa" }}
      >
        <select className="ql-font" defaultValue="sans-serif">
          <option value="sans-serif">Sans</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>

        <select className="ql-size" defaultValue="">
          <option value="small">Small</option>
          <option value="">Normal</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>

        <select className="ql-header" defaultValue="">
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="">Normal</option>
        </select>

        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
        <button className="ql-strike" />

        <select className="ql-color" />
        <select className="ql-background" />

        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-blockquote" />
        <button className="ql-code-block" />

        <select className="ql-align" />

        <button className="ql-link" />
        <button className="ql-image" />

        <button className="ql-clean" />
        <button type="button" onClick={() => quillRef.current?.history?.undo?.()}>Undo</button>
        <button type="button" onClick={() => quillRef.current?.history?.redo?.()}>Redo</button>
      </div>

      {/* Optional visual ruler */}
      <div style={{
        height: 22,
        background: "repeating-linear-gradient(to right, #f0f0f0, #f0f0f0 19px, #e5e5e5 20px)",
        borderLeft: "1px solid #e5e7eb",
        borderRight: "1px solid #e5e7eb",
      }} />

      {/* Editor container */}
      <div
        ref={editorRef}
        style={{
          minHeight: 320,
          border: "1px solid #e5e7eb",
          padding: 12,
          background: "#fff",
          borderTop: "none",
        }}
      />
    </div>
  );
}