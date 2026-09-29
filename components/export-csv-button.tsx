"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function escapeCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ExportCsvButton({
  filename,
  headers,
  rows,
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null)[][];
  disabled?: boolean;
}) {
  function download() {
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={disabled}>
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  );
}
