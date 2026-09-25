import { getArptMarketReport } from "@/lib/arpt-market-indicators";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await getArptMarketReport(Number(id));
  if (!report?.pdfUrl)
    return Response.json({ message: "Document introuvable." }, { status: 404 });

  try {
    const upstream = await fetch(report.pdfUrl, {
      headers: {
        Accept: "application/pdf",
        "User-Agent": "ARPT-Guinee-Frontend/1.0",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok || !upstream.body)
      throw new Error(`PDF upstream returned ${upstream.status}`);

    const download = new URL(request.url).searchParams.get("download") === "1";
    const fallbackName = `observatoire-arpt-${report.id}.pdf`;
    const sourceName = decodeURIComponent(
      new URL(report.pdfUrl).pathname.split("/").pop() || fallbackName,
    ).replace(/[^\p{L}\p{N}._-]+/gu, "-");
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${sourceName}"`,
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(`Unable to proxy ARPT report ${report.id}`, error);
    return Response.json(
      { message: "Le document est temporairement indisponible." },
      { status: 502 },
    );
  }
}
