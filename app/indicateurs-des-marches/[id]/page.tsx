import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { getArptMarketReport } from "@/lib/arpt-market-indicators";

export default async function MarketReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getArptMarketReport(Number(id));
  if (!report) notFound();
  const t = await getTranslations("statisticsPage");
  const documentUrl = `/api/indicateurs-des-marches/${report.id}/document`;

  return (
    <>
      <PageHero
        surtitre={t(`categories.${report.category}`)}
        titre={report.title}
        description={t("readerDescription")}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/indicateurs-des-marches">
              <ArrowLeft aria-hidden />
              {t("backToArchive")}
            </Link>
          </Button>
          <Button asChild>
            <a href={`${documentUrl}?download=1`}>
              <Download aria-hidden />
              {t("downloadPdf")}
            </a>
          </Button>
        </div>
      </PageHero>

      <section className="section-y bg-muted/30">
        <div className="container-content">
          <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
            <FileText className="size-4 text-primary" aria-hidden />
            <span>
              {report.year ?? t("report")}
              {report.quarter ? ` · T${report.quarter}` : ""}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {report.pdfUrl ? (
              <iframe
                src={`${documentUrl}#toolbar=1&navpanes=0`}
                title={report.title}
                className="h-[75vh] min-h-[620px] w-full bg-white"
              />
            ) : (
              <div className="grid min-h-96 place-items-center p-8 text-center text-muted-foreground">
                {t("documentUnavailable")}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
