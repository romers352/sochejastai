"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Element = {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: Element[];
  layout?: Record<string, any>;
};

type Section = {
  id: string;
  type: string;
  title?: string;
  layout?: Record<string, any>;
  styles?: Record<string, any>;
  elements: Element[];
};

type SectionsData = { sections: Section[] };

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function useDebouncedSaver(value: SectionsData, delay: number, onSave: (data: SectionsData) => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const last = useRef<string>("");

  useEffect(() => {
    const payload = JSON.stringify(value);
    if (payload === last.current) return;
    last.current = payload;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(value);
      } finally {
        setSaving(false);
      }
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, delay, onSave]);

  return saving;
}

export default function AdminHomeSectionsPage() {
  const [data, setData] = useState<SectionsData>({ sections: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [hover, setHover] = useState<{
    sectionIdx: number;
    insertIndex: number | null;
    inContainer: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/home/sections");
        if (!res.ok) throw new Error("Failed to load sections");
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saving = useDebouncedSaver(
    data,
    800,
    async (payload) => {
      await fetch("/api/admin/home/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  );

  const snapshot = useMemo(() => JSON.stringify(data), [data]);
  useEffect(() => {
    setHistory((h) => [...h, snapshot].slice(-50));
    setFuture([]);
  }, [snapshot]);

  function undo() {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const prev = h[h.length - 2];
      setFuture((f) => [h[h.length - 1], ...f].slice(0, 50));
      setData(JSON.parse(prev));
      return h.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory((h) => [...h, next].slice(-50));
      setData(JSON.parse(next));
      return f.slice(1);
    });
  }

  function addSection(type: string) {
    setData((d) => ({
      sections: [
        ...d.sections,
        { id: uid(type), type, title: type[0].toUpperCase() + type.slice(1), layout: {}, styles: {}, elements: [] },
      ],
    }));
  }

  function updateSection(idx: number, patch: Partial<Section>) {
    setData((d) => ({
      sections: d.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function removeSection(idx: number) {
    setData((d) => ({ sections: d.sections.filter((_, i) => i !== idx) }));
  }

  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) return;
    setData((d) => {
      const next = [...d.sections];
      const [moved] = next.splice(dragIdx!, 1);
      next.splice(idx, 0, moved);
      return { sections: next };
    });
    setDragIdx(null);
  }

  function addElement(sectionIdx: number, type: string) {
    const defaults: Record<string, any> = {
      heading: { text: "Heading", level: 2 },
      text: { text: "Lorem ipsum dolor sit amet" },
      image: { src: "", alt: "" },
      video: { src: "", poster: "", autoplay: false, loop: false, controls: true },
      button: { text: "Click", href: "#" },
      feature: { icon: "⭐", title: "Feature", text: "Description" },
    };
    setData((d) => ({
      sections: d.sections.map((s, i) => (
        i === sectionIdx
          ? {
              ...s,
              elements: [
                ...s.elements,
                {
                  id: uid(type),
                  type,
                  props: defaults[type] || {},
                  layout: s.type === "canvas" ? { top: 10, left: 10, width: 30, height: 20, z: 1 } : undefined,
                },
              ],
            }
          : s
      )),
    }));
  }

  function updateElement(sectionIdx: number, elementIdx: number, patch: Partial<Element>) {
    setData((d) => ({
      sections: d.sections.map((s, i) => (
        i === sectionIdx ? { ...s, elements: s.elements.map((el, j) => (j === elementIdx ? { ...el, ...patch } : el)) } : s
      )),
    }));
  }

  function removeElement(sectionIdx: number, elementIdx: number) {
    setData((d) => ({
      sections: d.sections.map((s, i) => (
        i === sectionIdx ? { ...s, elements: s.elements.filter((_, j) => j !== elementIdx) } : s
      )),
    }));
  }

  // Drag-and-drop helpers for elements and palette
  function addElementAt(sectionIdx: number, insertIndex: number, type: string, containerId?: string | null) {
    const defaults: Record<string, any> = {
      heading: { text: "Heading", level: 2 },
      text: { text: "Lorem ipsum dolor sit amet" },
      image: { src: "", alt: "" },
      video: { src: "", poster: "", autoplay: false, loop: false, controls: true },
      button: { text: "Click", href: "#" },
      feature: { icon: "⭐", title: "Feature", text: "Description" },
      container: { gap: 8 },
    };
    const newElId = uid(type);
    const newEl: Element = {
      id: newElId,
      type,
      props: defaults[type] || {},
      children: type === "container" ? [] : undefined,
    };
    setData((d) => {
      const sections = [...d.sections];
      const s = sections[sectionIdx];
      if (!containerId) {
        const nextEls = [...s.elements];
        const elWithLayout = s.type === "canvas" ? { ...newEl, layout: { top: 10, left: 10, width: 30, height: 20, z: 1 } } : newEl;
        nextEls.splice(insertIndex, 0, elWithLayout);
        sections[sectionIdx] = { ...s, elements: nextEls };
      } else {
        const nextEls = s.elements.map((el) => {
          if (el.id === containerId) {
            const children = [...(el.children || [])];
            children.push(newEl);
            return { ...el, children };
          }
          return el;
        });
        sections[sectionIdx] = { ...s, elements: nextEls };
      }
      return { sections };
    });
  }

  function moveElement(sectionIdx: number, fromIndex: number, toIndex: number) {
    setData((d) => {
      const sections = [...d.sections];
      const s = sections[sectionIdx];
      const nextEls = [...s.elements];
      const [moved] = nextEls.splice(fromIndex, 1);
      nextEls.splice(toIndex, 0, moved);
      sections[sectionIdx] = { ...s, elements: nextEls };
      return { sections };
    });
  }

  function onPaletteDragStart(e: React.DragEvent, type: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "palette", type }));
  }

  function onElementDragStart(e: React.DragEvent, sectionIdx: number, elementIdx: number) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "element", sectionIdx, elementIdx }));
  }

  function handleDrop(e: React.DragEvent, sectionIdx: number, insertIndex: number, containerId?: string | null) {
    e.preventDefault();
    const payloadText = e.dataTransfer.getData("text/plain");
    if (!payloadText) return;
    try {
      const payload = JSON.parse(payloadText);
      if (payload.kind === "palette") {
        addElementAt(sectionIdx, insertIndex, payload.type, containerId);
      } else if (payload.kind === "element") {
        if (payload.sectionIdx === sectionIdx) {
          moveElement(sectionIdx, payload.elementIdx, insertIndex);
        } else {
          // Cross-section move
          setData((d) => {
            const sections = [...d.sections];
            const fromSec = sections[payload.sectionIdx];
            const toSec = sections[sectionIdx];
            const [moved] = fromSec.elements.splice(payload.elementIdx, 1);
            const nextEls = [...toSec.elements];
            nextEls.splice(insertIndex, 0, moved);
            sections[payload.sectionIdx] = { ...fromSec };
            sections[sectionIdx] = { ...toSec, elements: nextEls };
            return { sections };
          });
        }
      }
    } catch {}
    setHover(null);
  }

  function Preview() {
    return (
      <div className="rounded-xl border border-black/10 p-4 bg-white">
        {data.sections.length === 0 && (
          <p className="text-sm text-black/60">No sections yet. Add a section to start.</p>
        )}
        {data.sections.map((s) => (
          <div key={s.id} className="my-4 p-4 rounded-lg border border-black/10" style={{ background: s.layout?.background }}>
            {s.title && <h2 className="text-xl font-semibold mb-2">{s.title}</h2>}
            {s.type !== "canvas" && (
              <div className="space-y-2">
                {s.elements.map((el) => {
                  switch (el.type) {
                    case "heading":
                      return <h3 key={el.id} className="text-lg font-bold">{el.props?.text}</h3>;
                    case "text":
                      return <p key={el.id} className="text-black/80">{el.props?.text}</p>;
                    case "image":
                      return <img key={el.id} src={el.props?.src || ""} alt={el.props?.alt || ""} className="max-w-full rounded" />;
                    case "video":
                      return (
                        <video key={el.id} src={el.props?.src || ""} poster={el.props?.poster || undefined} controls={el.props?.controls ?? true} autoPlay={el.props?.autoplay ?? false} loop={el.props?.loop ?? false} className="w-full rounded" />
                      );
                    case "button":
                      return <a key={el.id} href={el.props?.href || "#"} className="inline-block px-3 py-1.5 rounded bg-black text-white">{el.props?.text}</a>;
                    case "feature":
                      return (
                        <div key={el.id} className="flex items-center gap-2">
                          <span>{el.props?.icon}</span>
                          <div>
                            <div className="font-medium">{el.props?.title}</div>
                            <div className="text-black/70 text-sm">{el.props?.text}</div>
                          </div>
                        </div>
                      );
                    case "container":
                      return (
                        <div key={el.id} className="p-3 rounded border border-black/20">
                          {(el.children || []).length === 0 && (
                            <div className="text-xs text-black/50">Empty container</div>
                          )}
                          <div className="space-y-2">
                            {(el.children || []).map((child) => {
                              switch (child.type) {
                                case "heading":
                                  return <h3 key={child.id} className="text-lg font-bold">{child.props?.text}</h3>;
                                case "text":
                                  return <p key={child.id} className="text-black/80">{child.props?.text}</p>;
                                case "image":
                                  return <img key={child.id} src={child.props?.src || ""} alt={child.props?.alt || ""} className="max-w-full rounded" />;
                                case "video":
                                  return (
                                    <video key={child.id} src={child.props?.src || ""} poster={child.props?.poster || undefined} controls={child.props?.controls ?? true} autoPlay={child.props?.autoplay ?? false} loop={child.props?.loop ?? false} className="w-full rounded" />
                                  );
                                case "button":
                                  return <a key={child.id} href={child.props?.href || "#"} className="inline-block px-3 py-1.5 rounded bg-black text-white">{child.props?.text}</a>;
                                case "feature":
                                  return (
                                    <div key={child.id} className="flex items-center gap-2">
                                      <span>{child.props?.icon}</span>
                                      <div>
                                        <div className="font-medium">{child.props?.title}</div>
                                        <div className="text-black/70 text-sm">{child.props?.text}</div>
                                      </div>
                                    </div>
                                  );
                                default:
                                  return <div key={child.id} className="text-xs text-black/50">Unsupported element: {child.type}</div>;
                              }
                            })}
                          </div>
                        </div>
                      );
                    default:
                      return <div key={el.id} className="text-xs text-black/50">Unsupported element: {el.type}</div>;
                  }
                })}
              </div>
            )}
            {s.type === "canvas" && (
              <div className="relative border border-black/20 bg-white" style={{ height: (s.layout?.canvasHeight ?? 600) + "px" }}>
                {s.elements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute rounded border border-black/20 bg-white/90"
                    style={{
                      top: `${el.layout?.top ?? 10}%`,
                      left: `${el.layout?.left ?? 10}%`,
                      width: `${el.layout?.width ?? 30}%`,
                      height: `${el.layout?.height ?? 20}%`,
                      zIndex: el.layout?.z ?? 1,
                    }}
                  >
                    {el.type === "image" && (
                      <img src={el.props?.src || ""} alt={el.props?.alt || ""} className="h-full w-full object-cover" />
                    )}
                    {el.type === "video" && (
                      <video src={el.props?.src || ""} poster={el.props?.poster || undefined} controls={el.props?.controls ?? true} autoPlay={el.props?.autoplay ?? false} loop={el.props?.loop ?? false} className="h-full w-full object-cover" />
                    )}
                    {el.type === "text" && (
                      <div className="h-full w-full p-2 text-sm text-black/80 overflow-auto">
                        {el.props?.text || "Text"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-black/70">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span> / </span>
        <span className="font-semibold text-black">Homepage Sections</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black">Manage Sections</h1>
            <div className="flex items-center gap-2">
              <button onClick={undo} className="px-3 py-1.5 rounded-md border border-black text-black disabled:opacity-50" disabled={history.length <= 1}>Undo</button>
              <button onClick={redo} className="px-3 py-1.5 rounded-md border border-black text-black disabled:opacity-50" disabled={future.length === 0}>Redo</button>
              <span className="text-xs text-black/60">{saving ? "Saving…" : "Autosaved"}</span>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-white border border-black text-black px-4 py-2">{error}</div>
          )}

          <div className="rounded-xl border border-black/10 p-4 bg-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {['hero','features','custom','canvas'].map((t) => (
                <button key={t} onClick={() => addSection(t)} className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/90">Add {t}</button>
              ))}
            </div>

            <div className="space-y-3">
              {loading && <p className="text-black/60">Loading sections…</p>}
              {!loading && data.sections.length === 0 && (
                <p className="text-black/60">No sections added yet.</p>
              )}
              {data.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(idx)}
                  className="group rounded-lg border border-black/20 p-3 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-black text-white">{sec.type}</span>
                      <input
                        value={sec.title || ""}
                        onChange={(e) => updateSection(idx, { title: e.target.value })}
                        placeholder="Section title"
                        className="px-2 py-1 rounded border border-black/20 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeSection(idx)} className="px-2 py-1 text-sm rounded border border-black text-black">Delete</button>
                    </div>
                  </div>

                  <div className="mt-3 rounded border border-dashed border-black/20 p-3 bg-white">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['heading','text','image','video','button','feature','container'].map((t) => (
                        <div
                          key={t}
                          draggable
                          onDragStart={(e) => onPaletteDragStart(e, t)}
                          className="px-2 py-1 text-sm rounded bg-black text-white cursor-move"
                          title="Drag to add"
                        >
                          {t}
                        </div>
                      ))}
                    </div>

                    {sec.type !== 'canvas' && (
                      <div className="space-y-2">
                      {sec.elements.length === 0 && (
                        <p className="text-xs text-black/50">No elements. Add one above.</p>
                      )}
                      {/* Top insert drop zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setHover({ sectionIdx: idx, insertIndex: 0, inContainer: null }); }}
                        onDrop={(e) => handleDrop(e, idx, 0)}
                        className={`h-2 rounded ${hover && hover.sectionIdx === idx && hover.insertIndex === 0 ? 'bg-blue-300' : 'bg-transparent'}`}
                      />
                      {sec.elements.map((el, j) => (
                        <React.Fragment key={el.id}>
                          <div
                            draggable
                            onDragStart={(e) => onElementDragStart(e, idx, j)}
                            className="rounded border border-black/20 p-2 bg-white"
                          >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-black/60">{el.type}</span>
                            <button onClick={() => removeElement(idx, j)} className="px-2 py-1 text-xs rounded border border-black text-black">Remove</button>
                          </div>
                          {el.type === "heading" && (
                            <div className="flex gap-2">
                              <input
                                value={el.props.text || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, text: e.target.value } })}
                                placeholder="Heading text"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                            </div>
                          )}
                          {el.type === "text" && (
                            <textarea
                              value={el.props.text || ""}
                              onChange={(e) => updateElement(idx, j, { props: { ...el.props, text: e.target.value } })}
                              placeholder="Paragraph text"
                              className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                            />
                          )}
                          {el.type === "image" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <input
                                value={el.props.src || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, src: e.target.value } })}
                                placeholder="Image URL"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                              <input
                                value={el.props.alt || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, alt: e.target.value } })}
                                placeholder="Alt text"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                            </div>
                          )}
                          {el.type === "button" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <input
                                value={el.props.text || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, text: e.target.value } })}
                                placeholder="Button text"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                              <input
                                value={el.props.href || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, href: e.target.value } })}
                                placeholder="Link href"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                            </div>
                          )}
                          {el.type === "feature" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <input
                                value={el.props.icon || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, icon: e.target.value } })}
                                placeholder="Icon"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                              <input
                                value={el.props.title || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, title: e.target.value } })}
                                placeholder="Title"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                              <input
                                value={el.props.text || ""}
                                onChange={(e) => updateElement(idx, j, { props: { ...el.props, text: e.target.value } })}
                                placeholder="Description"
                                className="px-2 py-1 rounded border border-black/20 bg-white w-full"
                              />
                            </div>
                          )}
                          {el.type === "container" && (
                            <div className="rounded border border-black/20 p-2 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-black/60">Container</span>
                              </div>
                              <div className="space-y-2">
                                {/* Nested drop area at start */}
                                <div
                                  onDragOver={(e) => { e.preventDefault(); setHover({ sectionIdx: idx, insertIndex: j, inContainer: el.id }); }}
                                  onDrop={(e) => handleDrop(e, idx, j, el.id)}
                                  className={`h-2 rounded ${hover && hover.sectionIdx === idx && hover.insertIndex === j && hover.inContainer === el.id ? 'bg-blue-300' : 'bg-transparent'}`}
                                />
                                {(el.children || []).length === 0 && (
                                  <p className="text-xs text-black/50">Drag items from the palette into this container.</p>
                                )}
                                {(el.children || []).map((child) => (
                                  <div key={child.id} className="rounded border border-black/20 p-2 bg-white">
                                    <span className="text-xs text-black/60">{child.type}</span>
                                  </div>
                                ))}
                                {/* Nested drop area at end */}
                                <div
                                  onDragOver={(e) => { e.preventDefault(); setHover({ sectionIdx: idx, insertIndex: j, inContainer: el.id }); }}
                                  onDrop={(e) => handleDrop(e, idx, j, el.id)}
                                  className={`h-2 rounded ${hover && hover.sectionIdx === idx && hover.insertIndex === j && hover.inContainer === el.id ? 'bg-blue-300' : 'bg-transparent'}`}
                                />
                              </div>
                            </div>
                          )}
                          </div>
                          {/* Insert drop zone after element */}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setHover({ sectionIdx: idx, insertIndex: j + 1, inContainer: null }); }}
                            onDrop={(e) => handleDrop(e, idx, j + 1)}
                            className={`h-2 rounded ${hover && hover.sectionIdx === idx && hover.insertIndex === j + 1 ? 'bg-blue-300' : 'bg-transparent'}`}
                          />
                        </React.Fragment>
                      ))}
                      </div>
                    )}
                    {sec.type === 'canvas' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-black/60">Canvas height (px)</label>
                          <input
                            type="number"
                            value={sec.layout?.canvasHeight ?? 600}
                            onChange={(e) => updateSection(idx, { layout: { ...sec.layout, canvasHeight: Number(e.target.value) } })}
                            className="px-2 py-1 rounded border border-black/20 bg-white w-24"
                          />
                        </div>
                        <div
                          id={`canvas-${sec.id}`}
                          className="relative rounded border border-dashed border-black/20 bg-white"
                          style={{ height: (sec.layout?.canvasHeight ?? 600) + 'px' }}
                        >
                          {sec.elements.length === 0 && (
                            <p className="absolute inset-0 m-auto w-max text-xs text-black/50">Drag items from the palette onto the canvas.</p>
                          )}
                          {sec.elements.map((el, j) => (
                            <div
                              key={el.id}
                              className="absolute group"
                              style={{
                                top: `${el.layout?.top ?? 10}%`,
                                left: `${el.layout?.left ?? 10}%`,
                                width: `${el.layout?.width ?? 30}%`,
                                height: `${el.layout?.height ?? 20}%`,
                                zIndex: el.layout?.z ?? 1,
                              }}
                            >
                              <div className="absolute -top-6 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-black text-white">{el.type}</span>
                                <button onClick={() => removeElement(idx, j)} className="px-2 py-0.5 text-xs rounded border border-black text-black">Delete</button>
                              </div>
                              <div
                                onMouseDown={(e) => {
                                  const rect = (document.getElementById(`canvas-${sec.id}`) as HTMLDivElement)?.getBoundingClientRect();
                                  const elRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                  const startX = e.clientX;
                                  const startY = e.clientY;
                                  const offsetX = startX - elRect.left;
                                  const offsetY = startY - elRect.top;
                                  function onMove(ev: MouseEvent) {
                                    if (!rect) return;
                                    const dx = ev.clientX - startX;
                                    const dy = ev.clientY - startY;
                                    const newLeftPx = elRect.left + dx - rect.left;
                                    const newTopPx = elRect.top + dy - rect.top;
                                    const leftPct = Math.max(0, Math.min(100, (newLeftPx / rect.width) * 100));
                                    const topPct = Math.max(0, Math.min(100, (newTopPx / rect.height) * 100));
                                    updateElement(idx, j, { layout: { ...el.layout, left: leftPct, top: topPct } });
                                  }
                                  function onUp() {
                                    window.removeEventListener('mousemove', onMove);
                                    window.removeEventListener('mouseup', onUp);
                                  }
                                  window.addEventListener('mousemove', onMove);
                                  window.addEventListener('mouseup', onUp);
                                }}
                                className="h-full w-full rounded border border-black/20 bg-white overflow-hidden cursor-move"
                              >
                                {el.type === 'image' && (
                                  <img src={el.props?.src || ''} alt={el.props?.alt || ''} className="h-full w-full object-cover" />
                                )}
                                {el.type === 'video' && (
                                  <video src={el.props?.src || ''} poster={el.props?.poster || undefined} controls={el.props?.controls ?? true} autoPlay={el.props?.autoplay ?? false} loop={el.props?.loop ?? false} className="h-full w-full object-cover" />
                                )}
                                {el.type === 'text' && (
                                  <div className="h-full w-full p-2 text-sm text-black/80 overflow-auto">
                                    <textarea
                                      value={el.props?.text || ''}
                                      onChange={(e) => updateElement(idx, j, { props: { ...el.props, text: e.target.value } })}
                                      className="w-full h-full bg-transparent outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                              {/* Resize handles */}
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const rect = (document.getElementById(`canvas-${sec.id}`) as HTMLDivElement)?.getBoundingClientRect();
                                  const elRect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
                                  const startX = e.clientX;
                                  const startY = e.clientY;
                                  const startW = elRect.width;
                                  const startH = elRect.height;
                                  function onMove(ev: MouseEvent) {
                                    if (!rect) return;
                                    const dx = ev.clientX - startX;
                                    const dy = ev.clientY - startY;
                                    const newW = Math.max(40, startW + dx);
                                    const newH = Math.max(40, startH + dy);
                                    const wPct = Math.max(5, Math.min(100, (newW / rect.width) * 100));
                                    const hPct = Math.max(5, Math.min(100, (newH / rect.height) * 100));
                                    updateElement(idx, j, { layout: { ...el.layout, width: wPct, height: hPct } });
                                  }
                                  function onUp() {
                                    window.removeEventListener('mousemove', onMove);
                                    window.removeEventListener('mouseup', onUp);
                                  }
                                  window.addEventListener('mousemove', onMove);
                                  window.addEventListener('mouseup', onUp);
                                }}
                                className="absolute right-0 bottom-0 h-3 w-3 bg-black cursor-se-resize"
                              />
                            </div>
                          ))}
                          {/* Drop to add into canvas */}
                          <div
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => {
                              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const y = e.clientY - rect.top;
                              const left = Math.max(0, Math.min(100, (x / rect.width) * 100));
                              const top = Math.max(0, Math.min(100, (y / rect.height) * 100));
                              const dt = e.dataTransfer?.getData('text/plain') || '';
                              // dt format: palette:type or element:sectionIdx:elementIdx
                              const [kind, a, b] = dt.split(':');
                              if (kind === 'palette') {
                                const type = a;
                                setData((d) => {
                                  const sections = [...d.sections];
                                  const s = sections[idx];
                                  const newEl: Element = {
                                    id: uid(type),
                                    type,
                                    props: {},
                                    layout: { top, left, width: 20, height: 15, z: 1 },
                                  };
                                  sections[idx] = { ...s, elements: [...s.elements, newEl] };
                                  return { sections };
                                });
                              }
                            }}
                            className="absolute inset-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:w-1/3 space-y-4">
          <h2 className="text-xl font-semibold text-black">Real-time Preview</h2>
          <Preview />
        </div>
      </div>
    </div>
  );
}