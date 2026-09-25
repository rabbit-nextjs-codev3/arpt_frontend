import type { ObservatoryCategory } from "@/lib/arpt-market-indicators";
import { getArptMarketReports } from "@/lib/arpt-market-indicators";

const CATEGORIES = new Set<ObservatoryCategory>([
  "telecom",
  "tariff",
  "postal",
]);

export async function GET(request: Request) {
  try {
    const data = await getArptMarketReports();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as ObservatoryCategory | null;
    const year = Number(searchParams.get("year"));
    const query = searchParams.get("q")?.trim().toLocaleLowerCase() ?? "";
    const reports = data.reports.filter((report) => {
      if (category && CATEGORIES.has(category) && report.category !== category)
        return false;
      if (Number.isInteger(year) && year > 0 && report.year !== year)
        return false;
      return !query || report.title.toLocaleLowerCase().includes(query);
    });

    return Response.json(
      { ...data, filteredCount: reports.length, reports },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Unable to refresh ARPT observatory reports", error);
    return Response.json(
      {
        message:
          "Les publications des observatoires ARPT sont temporairement indisponibles.",
      },
      { status: 502 },
    );
  }
}
