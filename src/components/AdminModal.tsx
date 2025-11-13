"use client";
import React, { useEffect } from "react";

type AdminModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function AdminModal({ isOpen, onClose, title, children }: AdminModalProps) {
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="absolute inset-0 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full rounded-lg bg-white shadow-lg border border-black/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
            <h3 className="text-lg font-semibold text-black">{title || "Preview"}</h3>
            <button onClick={onClose} aria-label="Close preview" className="px-3 py-1.5 rounded-md border border-black text-black hover:bg-black/10">
              Close
            </button>
          </div>
          <div className="p-4">
            <div className="w-full max-h-[70vh] overflow-auto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}