import "server-only";
import { renderPdf } from "./render-pdf";

export type PdfTable = {
  title: string;
  columns: string[];
  rows: string[][];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export async function renderTablePdf(table: PdfTable): Promise<Uint8Array> {
  const heading = escapeHtml(table.title);
  const header = table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
        @page { size: ${table.columns.length > 5 ? "A4 landscape" : "A4 portrait"}; margin: 20mm 12mm 17mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #203449; font-family: Arial, sans-serif; font-size: 10px; }
        h1 { margin: 0 0 7mm; color: #0d4970; font-size: 19px; }
        .meta { margin: 0 0 6mm; color: #637487; font-size: 10px; }
        table { border-collapse: collapse; table-layout: fixed; width: 100%; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        th, td { padding: 7px 8px; border-bottom: 1px solid #dce5eb; overflow-wrap: anywhere; vertical-align: top; text-align: left; }
        th { background: #e2eef6; color: #133f60; font-weight: 700; }
        tbody tr:nth-child(even) { background: #f7fafc; }
      </style></head><body><h1>ARPT · ${heading}</h1><p class="meta">${escapeHtml(new Date().toLocaleDateString("fr-FR"))} · ${table.rows.length} entrées</p><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  return renderPdf(html, table.columns.length > 5);
}
