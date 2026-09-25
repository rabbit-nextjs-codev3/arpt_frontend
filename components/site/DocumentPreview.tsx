"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Download, FileText, X } from "lucide-react";

type DocumentInfo = { url: string; title: string };
const PreviewContext = createContext<(document: DocumentInfo) => void>(
  () => {},
);

export function DocumentPreviewProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const open = useCallback((value: DocumentInfo) => setDocument(value), []);

  useEffect(() => {
    if (!document) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDocument(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [document]);

  useEffect(() => {
    function interceptDocumentLink(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>(
        "a[data-document-preview]",
      );
      if (!anchor?.href) return;
      event.preventDefault();
      open({
        url: anchor.href,
        title:
          anchor.getAttribute("aria-label") ||
          anchor.textContent?.trim() ||
          "Document",
      });
    }
    window.document.addEventListener("click", interceptDocumentLink, true);
    return () =>
      window.document.removeEventListener("click", interceptDocumentLink, true);
  }, [open]);

  async function downloadDocument() {
    if (!document) return;
    setDownloadError("");
    try {
      const response = await fetch(document.url);
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = decodeURIComponent(
        new URL(document.url).pathname.split("/").pop() || "document.pdf",
      );
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setDownloadError(
        "Téléchargement impossible. Vérifiez l’accès au document.",
      );
    }
  }

  return (
    <PreviewContext.Provider value={open}>
      {children}
      {document &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDocument(null);
            }}
          >
            <section
              data-document-preview-dialog
              role="dialog"
              aria-modal="true"
              aria-label={document.title}
              className="flex h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText
                    className="size-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <h2 className="truncate font-semibold">{document.title}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadDocument}
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
                    aria-label="Télécharger le document"
                  >
                    <Download className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Télécharger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocument(null)}
                    className="grid size-9 place-items-center rounded-md hover:bg-muted"
                    aria-label="Fermer"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </div>
              </header>
              {downloadError && (
                <p role="alert" className="px-4 py-2 text-sm text-destructive">
                  {downloadError}
                </p>
              )}
              {document.url.toLowerCase().split("?")[0].endsWith(".pdf") ? (
                <iframe
                  src={`${document.url}#toolbar=0`}
                  title={document.title}
                  className="min-h-0 flex-1 bg-white"
                />
              ) : /\.(png|jpe?g|webp|gif)(\?|$)/i.test(document.url) ? (
                <div className="flex min-h-0 flex-1 items-center justify-center bg-muted p-4">
                  <img
                    src={document.url}
                    alt={document.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
                  Aperçu indisponible pour ce format. Utilisez le bouton
                  Télécharger.
                </div>
              )}
            </section>
          </div>,
          window.document.body,
        )}
    </PreviewContext.Provider>
  );
}

export function useDocumentPreview() {
  return useContext(PreviewContext);
}
