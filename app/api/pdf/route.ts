import { renderTablePdf, type PdfTable } from "@/lib/pdf/render-table-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

let activeRenders = 0;

function isPdfTable(value: unknown): value is PdfTable {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.title !== "string" || item.title.length > 120) return false;
  const columns = item.columns;
  if (!Array.isArray(columns) || columns.length < 1 || columns.length > 12) return false;
  if (!columns.every((cell) => typeof cell === "string" && cell.length <= 100)) return false;
  if (!Array.isArray(item.rows) || item.rows.length > 1000) return false;
  return item.rows.every((row) => Array.isArray(row) && row.length === columns.length && row.every((cell) => typeof cell === "string" && cell.length <= 2000));
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ message: "Connexion requise." }, { status: 401 });

  // PDF generation stays in Next.js. NestJS only confirms the existing admin session.
  let admin: { isStaff?: boolean; isSuperuser?: boolean };
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/me`, {
      headers: { Authorization: authorization }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return Response.json({ message: "Session invalide." }, { status: response.status === 401 ? 401 : 403 });
    admin = await response.json();
  } catch {
    return Response.json({ message: "Vérification de la session indisponible." }, { status: 503 });
  }
  if (!admin.isStaff && !admin.isSuperuser) return Response.json({ message: "Accès réservé à l’administration." }, { status: 403 });

  if (Number(request.headers.get("content-length") ?? 0) > 2_000_000) return Response.json({ message: "Rapport trop volumineux." }, { status: 413 });
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return Response.json({ message: "Requête invalide." }, { status: 400 });
  }
  if (raw.length > 2_000_000) return Response.json({ message: "Rapport trop volumineux." }, { status: 413 });
  let table: unknown;
  try { table = JSON.parse(raw); } catch { return Response.json({ message: "JSON invalide." }, { status: 400 }); }
  if (!isPdfTable(table)) return Response.json({ message: "Données de rapport invalides." }, { status: 400 });
  if (activeRenders >= 2) return Response.json({ message: "Génération en cours, réessayez." }, { status: 503 });

  activeRenders += 1;
  try {
    const pdf = await renderTablePdf(table);
    const bytes = new Uint8Array(pdf.byteLength);
    bytes.set(pdf);
    return new Response(bytes.buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="rapport-arpt.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return Response.json({ message: "Impossible de générer le PDF." }, { status: 500 });
  } finally {
    activeRenders -= 1;
  }
}
