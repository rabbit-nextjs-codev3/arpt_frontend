import "server-only";

export type ObservatoryCategory = "telecom" | "tariff" | "postal";
export interface MarketReport {
  id: number;
  title: string;
  category: ObservatoryCategory;
  year: number | null;
  quarter: number | null;
  period: "quarterly" | "annual" | "other";
  publishedAt: string;
  updatedAt: string;
  pdfUrl: string | null;
}
export interface MarketReportsResponse {
  fetchedAt: string;
  count: number;
  years: number[];
  counts: Record<ObservatoryCategory, number>;
  reports: MarketReport[];
}
interface BackendReport {
  id: number;
  title: string;
  year: number;
  quarter: number | null;
  sector: "TELECOM" | "TARIFAIRE" | "POSTAL";
  fileUrl: string | null;
  createdAt: string;
}
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const CATEGORY_BY_SECTOR = {
  TELECOM: "telecom",
  TARIFAIRE: "tariff",
  POSTAL: "postal",
} as const;
function normalize(report: BackendReport): MarketReport {
  const category = CATEGORY_BY_SECTOR[report.sector];
  return {
    id: report.id,
    title: report.title,
    category,
    year: report.year,
    quarter: report.quarter,
    period: report.quarter
      ? "quarterly"
      : /annuel/i.test(report.title)
        ? "annual"
        : "other",
    publishedAt: report.createdAt,
    updatedAt: report.createdAt,
    pdfUrl: report.fileUrl,
  };
}
export async function getArptMarketReports(): Promise<MarketReportsResponse> {
  const response = await fetch(
    API_URL + "/statistics/reports?lang=fr&pageSize=100&ordering=-createdAt",
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error("ARPT API reports returned " + response.status);
  const body = (await response.json()) as { results?: BackendReport[] };
  const all = (body.results ?? []).map(normalize);
  const categories: ObservatoryCategory[] = ["telecom", "tariff", "postal"];
  const reports = categories
    .flatMap((category) =>
      all.filter((report) => report.category === category).slice(0, 9),
    )
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const counts = { telecom: 0, tariff: 0, postal: 0 };
  for (const report of reports) counts[report.category]++;
  const years = [
    ...new Set(
      reports.map((r) => r.year).filter((v): v is number => v !== null),
    ),
  ].sort((a, b) => b - a);
  return {
    fetchedAt: new Date().toISOString(),
    count: reports.length,
    years,
    counts,
    reports,
  };
}
export async function getArptMarketReport(
  id: number,
): Promise<MarketReport | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const response = await fetch(
    API_URL + "/statistics/reports/" + id + "?lang=fr",
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error("ARPT API report returned " + response.status);
  return normalize((await response.json()) as BackendReport);
}
