"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdminQuillEditor from "../../../components/AdminQuillEditor";

export default function AdminLegalPage() {
  const [privacyHtml, setPrivacyHtml] = useState<string>("");
  const [termsHtml, setTermsHtml] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  // Legacy refs are no longer used; the Quill editor is controlled via state
  const privacyRef = useRef<HTMLDivElement | null>(null);
  const termsRef = useRef<HTMLDivElement | null>(null);
  const [activeEditor, setActiveEditor] = useState<"privacy" | "terms" | null>(null);
  const [cmdState, setCmdState] = useState({ bold: false, italic: false, underline: false, ul: false, ol: false, link: false, block: "p", align: "left" });
  const [privacyZoom, setPrivacyZoom] = useState<number>(100);
  const [termsZoom, setTermsZoom] = useState<number>(100);
  const privacySelRef = useRef<Range | null>(null);
  const termsSelRef = useRef<Range | null>(null);

  type IconName =
    | "undo" | "redo"
    | "bold" | "italic" | "underline" | "strikethrough"
    | "link" | "image"
    | "alignLeft" | "alignCenter" | "alignRight"
    | "bullets" | "numbered"
    | "indent" | "outdent"
    | "clear";

  function Icon({ name, className }: { name: IconName; className?: string }) {
    const cls = `icon ${className || ""}`;
    switch (name) {
      case "bold":
        return <span className="icon-text font-bold">B</span>;
      case "italic":
        return <span className="icon-text italic">I</span>;
      case "underline":
        return <span className="icon-text underline">U</span>;
      case "strikethrough":
        return <span className="icon-text line-through">S</span>;
      case "undo":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <polyline points="9,7 4,12 9,17" />
            <path d="M20 12a8 8 0 0 0-11-7" />
          </svg>
        );
      case "redo":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <polyline points="15,7 20,12 15,17" />
            <path d="M4 12a8 8 0 0 1 11-7" />
          </svg>
        );
      case "link":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <path d="M7 12h10" />
            <path d="M6 12a4 4 0 0 1 4-4h2" />
            <path d="M18 12a4 4 0 0 1-4 4h-2" />
          </svg>
        );
      case "image":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8" cy="10" r="2" />
            <polyline points="5,19 11,13 14,16 19,11 21,13 21,19" />
          </svg>
        );
      case "alignLeft":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <path d="M4 6h16 M4 10h12 M4 14h16 M4 18h12" />
          </svg>
        );
      case "alignCenter":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <path d="M6 6h12 M4 10h16 M6 14h12 M8 18h8" />
          </svg>
        );
      case "alignRight":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <path d="M4 6h16 M8 10h12 M4 14h16 M8 18h12" />
          </svg>
        );
      case "bullets":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <circle cx="6" cy="7" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="6" cy="17" r="2" />
            <path d="M10 7h10 M10 12h10 M10 17h10" />
          </svg>
        );
      case "numbered":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <rect x="5" y="5" width="3" height="3" rx="0.5" />
            <rect x="5" y="10" width="3" height="3" rx="0.5" />
            <rect x="5" y="15" width="3" height="3" rx="0.5" />
            <path d="M10 7h10 M10 12h10 M10 17h10" />
          </svg>
        );
      case "indent":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <path d="M4 6h16 M4 10h10" />
            <polyline points="14,12 18,10 18,14 14,12" />
            <path d="M4 16h16" />
          </svg>
        );
      case "outdent":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <path d="M4 6h16 M10 10h10" />
            <polyline points="10,12 6,10 6,14 10,12" />
            <path d="M4 16h16" />
          </svg>
        );
      case "clear":
        return (
          <svg viewBox="0 0 24 24" className={cls}>
            <polygon points="7,17 13,11 17,15 12,20 7,20" />
            <path d="M4 9l6-6 6 6" />
          </svg>
        );
      default:
        return null;
    }
  }

  function applyCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
  }

  function createLink(ref: React.RefObject<HTMLDivElement | null>) {
    const url = prompt("Enter URL");
    if (!url) return;
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.getRangeAt(0).collapsed) {
      // No text selected, insert link with URL as text
      document.execCommand("insertHTML", false, `<a href="${url}">${url}</a>`);
    } else {
      applyCmd("createLink", url);
    }
    refreshCmdState();
  }

  function applyBlock(tag: "p" | "h1" | "h2" | "h3") {
    document.execCommand("formatBlock", false, tag);
  }

  function applyAlign(al: "left" | "center" | "right") {
    const map: Record<string, string> = { left: "justifyLeft", center: "justifyCenter", right: "justifyRight" };
    document.execCommand(map[al]);
  }

  function closestBlockElementFromSelection(): HTMLElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = (node as Text).parentNode as Node;
    let el: HTMLElement | null = node as HTMLElement;
    while (el && el !== document.body && !["P","H1","H2","H3","LI","DIV"].includes(el.tagName)) {
      el = el.parentElement;
    }
    return el;
  }

  function applyIndentCss(ref: React.RefObject<HTMLDivElement | null>, deltaPx: number) {
    ref.current?.focus();
    const block = closestBlockElementFromSelection();
    if (!block || !ref.current || !ref.current.contains(block)) {
      // Fallback to execCommand if we can't find a block in the editor
      applyCmd(deltaPx > 0 ? "indent" : "outdent");
      refreshCmdState();
      return;
    }
    const current = parseInt(window.getComputedStyle(block).marginLeft || "0", 10) || 0;
    const next = Math.max(0, current + deltaPx);
    block.style.marginLeft = `${next}px`;
    refreshCmdState();
  }

  function applyFontFamily(ref: React.RefObject<HTMLDivElement | null>, family: string) {
    ref.current?.focus();
    // Use CSS-based font application for consistency
    try { document.execCommand("styleWithCSS", false, "true"); } catch {}
    document.execCommand("fontName", false, family);
    refreshCmdState();
  }

  function applyFontSize(ref: React.RefObject<HTMLDivElement | null>, level: number) {
    // level 1–7 (approx sizes); rely on styleWithCSS for span styles
    ref.current?.focus();
    try { document.execCommand("styleWithCSS", false, "true"); } catch {}
    document.execCommand("fontSize", false, String(level));
    refreshCmdState();
  }

  // More robust list toggling: if the browser doesn't create a list, insert a skeleton
  function toggleList(type: "ul" | "ol", ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.focus();
    const before = ref.current?.innerHTML || "";
    applyCmd(type === "ul" ? "insertUnorderedList" : "insertOrderedList");
    const after = ref.current?.innerHTML || "";
    if (after === before) {
      const skeleton = type === "ul" ? "<ul><li><br></li></ul>" : "<ol><li><br></li></ol>";
      document.execCommand("insertHTML", false, skeleton);
    }
    refreshCmdState();
  }

  function selectionRootNode(): Node | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = (node as Text).parentNode as Node;
    return node;
  }

  function isSelectionInside(ref: React.RefObject<HTMLDivElement | null>): boolean {
    const root = selectionRootNode();
    return !!(root && ref.current && ref.current.contains(root));
  }

  function refreshCmdState() {
    const insidePrivacy = isSelectionInside(privacyRef);
    const insideTerms = isSelectionInside(termsRef);
    setActiveEditor(insidePrivacy ? "privacy" : insideTerms ? "terms" : null);
    // Only show active states when selection is within an editor
    const enabled = insidePrivacy || insideTerms;
    // Detect link by ancestor traversal for better reliability
    const hasLinkAncestor = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      let node: Node = sel.getRangeAt(0).commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = (node as Text).parentNode as Node;
      let el: HTMLElement | null = node as HTMLElement;
      while (el && el !== document.body) {
        if (el.tagName === "A") return true;
        el = el.parentElement;
      }
      return false;
    };
    const base = {
      bold: enabled ? document.queryCommandState("bold") : false,
      italic: enabled ? document.queryCommandState("italic") : false,
      underline: enabled ? document.queryCommandState("underline") : false,
      ul: enabled ? document.queryCommandState("insertUnorderedList") : false,
      ol: enabled ? document.queryCommandState("insertOrderedList") : false,
      link: enabled ? hasLinkAncestor() : false,
    };
    // Detect current block tag and alignment
    let block: "p" | "h1" | "h2" | "h3" = "p";
    let align: "left" | "center" | "right" = "left";
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node = sel.getRangeAt(0).commonAncestorContainer;
      const elCandidate = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
      let el: HTMLElement | null = elCandidate;
      while (el && el !== document.body && !["P","H1","H2","H3","LI"].includes(el.tagName)) {
        el = el.parentElement;
      }
      if (el) {
        const tag = el.tagName.toLowerCase();
        block = tag === "h1" || tag === "h2" || tag === "h3" ? (tag as any) : "p";
        const ta = window.getComputedStyle(el).textAlign as any;
        align = ta === "center" || ta === "right" ? ta : "left";
      }
    }
    setCmdState({ ...base, block, align });
  }

  function saveSelectionSnapshot() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0).cloneRange();
    if (isSelectionInside(privacyRef)) {
      privacySelRef.current = range;
    } else if (isSelectionInside(termsRef)) {
      termsSelRef.current = range;
    }
  }

  function restoreSelection(ref: React.RefObject<HTMLDivElement | null>) {
    const sel = window.getSelection();
    if (!sel) return;
    const snap = ref === privacyRef ? privacySelRef.current : ref === termsRef ? termsSelRef.current : null;
    if (snap) {
      sel.removeAllRanges();
      sel.addRange(snap);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = text.split(/\r?\n/);
    const groups: string[][] = [];
    let g: string[] = [];
    for (const line of lines) {
      if (line.trim() === "") { if (g.length) { groups.push(g); g = []; } }
      else { g.push(line); }
    }
    if (g.length) groups.push(g);
    const blocks = groups.map((grp) => {
      const trimmed = grp.map((l) => l.trim());
      if (trimmed.every((l) => /^[-\*]\s+/.test(l))) {
        const items = trimmed.map((l) => `<li>${escapeHtml(l.replace(/^[-\*]\s+/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (trimmed.every((l) => /^\d+\.\s+/.test(l))) {
        const items = trimmed.map((l) => `<li>${escapeHtml(l.replace(/^\d+\.\s+/, ""))}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${escapeHtml(trimmed.join(" "))}</p>`;
    }).join("");
    document.execCommand("insertHTML", false, blocks);
  }

  useEffect(() => {
    // Prefer CSS styling for execCommand outputs (e.g., foreColor)
    try { document.execCommand("styleWithCSS", false, "true"); } catch {}
    (async () => {
      try {
        const res = await fetch("/api/admin/legal");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setPrivacyHtml(data?.privacy_html || "");
        setTermsHtml(data?.terms_html || "");
      } catch (e: any) {
        setMessage(e?.message || "Failed to load legal content");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = () => { saveSelectionSnapshot(); refreshCmdState(); };
    document.addEventListener("selectionchange", handler);
    document.addEventListener("mouseup", handler);
    document.addEventListener("keyup", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("keyup", handler);
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const payloadPrivacy = typeof privacyHtml === "string" ? privacyHtml : "";
      const payloadTerms = typeof termsHtml === "string" ? termsHtml : "";
      const res = await fetch("/api/admin/legal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy_html: payloadPrivacy, terms_html: payloadTerms }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Save failed");
      setMessage("Legal content saved");
    } catch (err: any) {
      setMessage(err?.message || "Failed to save legal content");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Legal (Privacy & Terms)</span>
      </nav>

      <h1 className="text-3xl font-bold text-black mb-2">Legal Content</h1>
      <p className="text-black/70 mb-6">Use the toolbar for bold, italic, underline, bullets, numbered lists, and links. This editor works like a simple Google Docs experience.</p>

      {message && (
        <div className="mb-6 rounded-md bg-white border border-black/10 text-black px-4 py-2">{message}</div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <section aria-labelledby="privacy-editor" className="rounded-xl border border-black/10 p-6 bg-white">
          <h2 id="privacy-editor" className="text-xl font-semibold text-black mb-3">Privacy Policy</h2>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm hidden">
            {/* Zoom */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Zoom</span>
              <select value={privacyZoom} onChange={(e) => setPrivacyZoom(parseInt(e.target.value, 10))} className="bg-white">
                <option value={75}>75%</option>
                <option value={90}>90%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
            </label>
            {/* Font family */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Font</span>
              <select onChange={(e) => applyFontFamily(privacyRef, e.target.value)} className="bg-white">
                <option value="inherit">Default</option>
                <option value="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial">Inter/System</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Roboto, Arial">Roboto</option>
              </select>
            </label>
            {/* Font size levels (approx px) */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Size</span>
              <select onChange={(e) => applyFontSize(privacyRef, parseInt(e.target.value, 10))} className="bg-white">
                <option value={2}>11</option>
                <option value={3}>13</option>
                <option value={4}>16</option>
                <option value={5}>18</option>
                <option value={6}>24</option>
                <option value={7}>32</option>
              </select>
            </label>
            <span className="mx-2 inline-block w-px bg-black/20" />
            <button
              type="button"
              aria-pressed={cmdState.bold}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.bold ? "bg-black text-white" : ""}`}
              onClick={() => { privacyRef.current?.focus(); applyCmd("bold"); refreshCmdState(); }}
            >
              <Icon name="bold" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.italic}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.italic ? "bg-black text-white" : ""}`}
              onClick={() => { privacyRef.current?.focus(); applyCmd("italic"); refreshCmdState(); }}
            >
              <Icon name="italic" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.underline}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.underline ? "bg-black text-white" : ""}`}
              onClick={() => { privacyRef.current?.focus(); applyCmd("underline"); refreshCmdState(); }}
            >
              <Icon name="underline" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { privacyRef.current?.focus(); applyCmd("strikethrough"); refreshCmdState(); }} aria-label="Strikethrough" title="Strikethrough"><Icon name="strikethrough" /></button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.ul}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.ul ? "bg-black text-white" : ""}`}
              onClick={() => toggleList("ul", privacyRef)}
            >
              <Icon name="bullets" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.ol}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.ol ? "bg-black text-white" : ""}`}
              onClick={() => toggleList("ol", privacyRef)}
            >
              <Icon name="numbered" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.link}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.link ? "bg-black text-white" : ""}`}
              onClick={() => createLink(privacyRef)}
              aria-label="Link" title="Link"
            >
              <Icon name="link" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { const url = prompt("Image URL"); if (!url) return; privacyRef.current?.focus(); restoreSelection(privacyRef); document.execCommand("insertImage", false, url); refreshCmdState(); }} aria-label="Insert image" title="Insert image"><Icon name="image" /></button>
            {/* Text color picker */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Text Color</span>
              <input type="color" aria-label="Text color" onChange={(e) => { privacyRef.current?.focus(); restoreSelection(privacyRef); try { document.execCommand("styleWithCSS", false, "true"); } catch {} document.execCommand("foreColor", false, e.target.value); refreshCmdState(); }} />
            </label>
            <span className="mx-2 inline-block w-px bg-black/20" />
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "p"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "p" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyBlock("p"); refreshCmdState(); }}>Paragraph</button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "h1"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "h1" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyBlock("h1"); refreshCmdState(); }}>H1</button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "h2"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "h2" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyBlock("h2"); refreshCmdState(); }}>H2</button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "h3"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "h3" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyBlock("h3"); refreshCmdState(); }}>H3</button>
            <span className="mx-2 inline-block w-px bg-black/20" />
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.align === "left"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.align === "left" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyAlign("left"); refreshCmdState(); }} aria-label="Align left" title="Align left"><Icon name="alignLeft" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.align === "center"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.align === "center" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyAlign("center"); refreshCmdState(); }} aria-label="Align center" title="Align center"><Icon name="alignCenter" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.align === "right"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.align === "right" ? "bg-black text-white" : ""}`} onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyAlign("right"); refreshCmdState(); }} aria-label="Align right" title="Align right"><Icon name="alignRight" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => applyIndentCss(privacyRef, 32)} aria-label="Indent" title="Indent"><Icon name="indent" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => applyIndentCss(privacyRef, -32)} aria-label="Outdent" title="Outdent"><Icon name="outdent" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyCmd("removeFormat"); refreshCmdState(); }} aria-label="Clear format" title="Clear format"><Icon name="clear" /></button>
            <span className="mx-2 inline-block w-px bg-black/20" />
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyCmd("undo"); refreshCmdState(); }} aria-label="Undo" title="Undo"><Icon name="undo" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { privacyRef.current?.focus(); restoreSelection(privacyRef); applyCmd("redo"); refreshCmdState(); }} aria-label="Redo" title="Redo"><Icon name="redo" /></button>
          </div>
          {/* Simple visual ruler */}
          <div className="editor-ruler mb-2 select-none hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="tick" style={{ left: `${(i+1) * 4}rem` }}>{i+1}</span>
            ))}
          </div>
            <AdminQuillEditor value={privacyHtml} onChange={setPrivacyHtml} />
        </section>

        <section aria-labelledby="terms-editor" className="rounded-xl border border-black/10 p-6 bg-white">
          <h2 id="terms-editor" className="text-xl font-semibold text-black mb-3">Terms & Conditions</h2>
          <div className="mb-3 flex flex-wrap gap-2 text-sm hidden">
            {/* Zoom */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Zoom</span>
              <select value={termsZoom} onChange={(e) => setTermsZoom(parseInt(e.target.value, 10))} className="bg-white">
                <option value={75}>75%</option>
                <option value={90}>90%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
            </label>
            {/* Font family */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Font</span>
              <select onChange={(e) => applyFontFamily(termsRef, e.target.value)} className="bg-white">
                <option value="inherit">Default</option>
                <option value="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial">Inter/System</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Roboto, Arial">Roboto</option>
              </select>
            </label>
            {/* Font size */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Size</span>
              <select onChange={(e) => applyFontSize(termsRef, parseInt(e.target.value, 10))} className="bg-white">
                <option value={2}>11</option>
                <option value={3}>13</option>
                <option value={4}>16</option>
                <option value={5}>18</option>
                <option value={6}>24</option>
                <option value={7}>32</option>
              </select>
            </label>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.bold}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.bold ? "bg-black text-white" : ""}`}
              onClick={() => { termsRef.current?.focus(); applyCmd("bold"); refreshCmdState(); }}
            >
              <Icon name="bold" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.italic}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.italic ? "bg-black text-white" : ""}`}
              onClick={() => { termsRef.current?.focus(); applyCmd("italic"); refreshCmdState(); }}
            >
              <Icon name="italic" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.underline}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.underline ? "bg-black text-white" : ""}`}
              onClick={() => { termsRef.current?.focus(); applyCmd("underline"); refreshCmdState(); }}
            >
              <Icon name="underline" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { termsRef.current?.focus(); applyCmd("strikethrough"); refreshCmdState(); }} aria-label="Strikethrough" title="Strikethrough"><Icon name="strikethrough" /></button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.ul}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.ul ? "bg-black text-white" : ""}`}
              onClick={() => toggleList("ul", termsRef)}
            >
              <Icon name="bullets" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.ol}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.ol ? "bg-black text-white" : ""}`}
              onClick={() => toggleList("ol", termsRef)}
            >
              <Icon name="numbered" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              aria-pressed={cmdState.link}
              className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.link ? "bg-black text-white" : ""}`}
              onClick={() => createLink(termsRef)}
              aria-label="Link" title="Link"
            >
              <Icon name="link" />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { const url = prompt("Image URL"); if (!url) return; termsRef.current?.focus(); restoreSelection(termsRef); document.execCommand("insertImage", false, url); refreshCmdState(); }} aria-label="Insert image" title="Insert image"><Icon name="image" /></button>
            {/* Text color picker */}
            <label className="flex items-center gap-2 px-2 py-1 rounded border border-black/20">
              <span className="text-black/70">Text Color</span>
              <input type="color" aria-label="Text color" onChange={(e) => { termsRef.current?.focus(); restoreSelection(termsRef); try { document.execCommand("styleWithCSS", false, "true"); } catch {} document.execCommand("foreColor", false, e.target.value); refreshCmdState(); }} />
            </label>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyCmd("removeFormat"); refreshCmdState(); }}>Clear Format</button>
            <span className="mx-2 inline-block w-px bg-black/20" />
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "p"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "p" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyBlock("p"); refreshCmdState(); }}>Paragraph</button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "h1"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "h1" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyBlock("h1"); refreshCmdState(); }}>H1</button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "h2"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "h2" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyBlock("h2"); refreshCmdState(); }}>H2</button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.block === "h3"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.block === "h3" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyBlock("h3"); refreshCmdState(); }}>H3</button>
            <span className="mx-2 inline-block w-px bg-black/20" />
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.align === "left"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.align === "left" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyAlign("left"); refreshCmdState(); }} aria-label="Align left" title="Align left"><Icon name="alignLeft" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.align === "center"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.align === "center" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyAlign("center"); refreshCmdState(); }} aria-label="Align center" title="Align center"><Icon name="alignCenter" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" aria-pressed={cmdState.align === "right"} className={`px-2 py-1 rounded border border-black/20 hover:bg-black/10 ${cmdState.align === "right" ? "bg-black text-white" : ""}`} onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyAlign("right"); refreshCmdState(); }} aria-label="Align right" title="Align right"><Icon name="alignRight" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => applyIndentCss(termsRef, 32)} aria-label="Indent" title="Indent"><Icon name="indent" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => applyIndentCss(termsRef, -32)} aria-label="Outdent" title="Outdent"><Icon name="outdent" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyCmd("undo"); refreshCmdState(); }} aria-label="Undo" title="Undo"><Icon name="undo" /></button>
            <button onMouseDown={(e) => e.preventDefault()} type="button" className="px-2 py-1 rounded border border-black/20 hover:bg-black/10" onClick={() => { termsRef.current?.focus(); restoreSelection(termsRef); applyCmd("redo"); refreshCmdState(); }} aria-label="Redo" title="Redo"><Icon name="redo" /></button>
          </div>
          {/* Simple visual ruler */}
          <div className="editor-ruler mb-2 select-none hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="tick" style={{ left: `${(i+1) * 4}rem` }}>{i+1}</span>
            ))}
          </div>
            <AdminQuillEditor value={termsHtml} onChange={setTermsHtml} />

        {/* Editor styles: ensure links look like expected and lists are clear */}
        <style jsx>{`
          .editor-content a { color: #2563eb; text-decoration: underline; }
          .editor-content ul { list-style-type: disc; padding-left: 1.5rem; }
          .editor-content ol { list-style-type: decimal; padding-left: 1.5rem; }
          .editor-content img { max-width: 100%; height: auto; }
          .editor-ruler { position: relative; height: 20px; background: #f8fafc; border: 1px solid rgba(0,0,0,0.1); }
          .editor-ruler .tick { position: absolute; top: 0; font-size: 10px; color: rgba(0,0,0,0.6); }
          .editor-ruler::before { content: ""; position: absolute; left: 0; right: 0; top: 10px; height: 1px; background: rgba(0,0,0,0.2); }
          .icon { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
          .icon-text { display: inline-block; width: 18px; text-align: center; font-size: 14px; line-height: 1; }
        `}</style>
        </section>

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90">Save Changes</button>
          <button type="button" className="px-4 py-2 rounded-md border border-black text-black hover:bg-black/10" onClick={() => { if (privacyRef.current) privacyRef.current.innerHTML = ""; if (termsRef.current) termsRef.current.innerHTML = ""; setPrivacyHtml(""); setTermsHtml(""); }}>Clear</button>
        </div>

        {loading && (<div className="text-black/60">Loading...</div>)}
      </form>
    </div>
  );
}