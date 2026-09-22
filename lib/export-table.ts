"use client";

import { toast } from "sonner";
import { getValidAccessToken } from "./api";

export type ExportFormat = "csv" | "pdf";

export async function exporterTableau(
  format: ExportFormat,
  fichier: string,
  colonnes: string[],
  lignes: (string | number)[][],
) {
  if (format === "csv") {
    const echapper = (valeur: string | number) => `"${String(valeur).replace(/"/g, '""')}"`;
    const contenu = [colonnes, ...lignes].map((ligne) => ligne.map(echapper).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${contenu}`], { type: "text/csv;charset=utf-8" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = fichier;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  try {
    const token = await getValidAccessToken();
    const response = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ title: fichier.replace(/\.csv$/i, "").replace(/[-_]/g, " "), columns: colonnes, rows: lignes.map((ligne) => ligne.map(String)) }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || "Impossible de générer le PDF.");
    }
    const url = URL.createObjectURL(await response.blob());
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = fichier.replace(/\.csv$/i, ".pdf");
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Impossible de générer le PDF.");
  }
}
