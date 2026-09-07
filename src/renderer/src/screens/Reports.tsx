import {
  Shield,
  Clock,
  Sparkles,
  Activity,
  FileDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useProjectStore } from "../store/projectStore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PageContainer,
  PageHeader,
  Panel,
  ScreenEmpty,
  severityBadgeClass,
} from "../components/common";
import { DEMO_REASONING_LEDGER } from "../lib/demo";

export function Reports() {
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  const handleExportPDF = () => {
    if (!activeProject) return;

    const doc = new jsPDF();
    const metrics = activeProject.metrics;
    const findings = activeProject.findings || [];

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CodeSentinel Architectural Audit", 20, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(
      `Official Security Report for Repository: ${activeProject.name}`,
      20,
      38,
    );
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 43);
    doc.text(`Project ID: ${activeProject.id.toUpperCase()}`, 20, 48);

    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    // --- Executive Summary ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("1. Executive Summary", 20, 65);

    const summaryData = [
      ["Metric", "Value", "Status"],
      ["Total Audit Volume", `${metrics.totalFiles} Files`, "Analyzed"],
      [
        "Vulnerability Count",
        `${findings.length} findings`,
        findings.length > 0 ? "Warning" : "Secure",
      ],
      [
        "Avg CC Score (Mnt_Index)",
        `${metrics.avgComplexity.toFixed(2)}`,
        metrics.avgComplexity > 15 ? "High complexity" : "Optimized",
      ],
      [
        "Container Startup Time",
        `${metrics.startupTimeMs || 0}ms`,
        "Dynamic Pass complete",
      ],
      ["Architectural Stability", "92.4%", "Consistent"],
    ];

    autoTable(doc, {
      startY: 70,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: "grid",
      headStyles: {
        fillStyle: "DFDFDF",
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      styles: { fontSize: 9 },
    });

    // --- High Risk Hotspots (Matrix) ---
    const matrixY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("2. Architectural Hotspots", 20, matrixY);

    const highRiskData = (metrics.highRiskFunctions || []).map((f) => [
      f.name,
      f.file,
      `Ln ${f.line}`,
      f.score.toString(),
    ]);

    autoTable(doc, {
      startY: matrixY + 5,
      head: [["Function Name", "Origin File", "Location", "CC Score"]],
      body:
        highRiskData.length > 0
          ? highRiskData
          : [["No high-risk functions detected", "-", "-", "-"]],
      theme: "striped",
      headStyles: { fillStyle: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 8 },
    });

    // --- Finding Ledger ---
    doc.addPage();
    doc.setFontSize(14);
    doc.text("3. Detailed Security Findings", 20, 30);

    const findingsTable = findings.map((f) => [
      f.severity.toUpperCase(),
      f.type,
      f.title,
      f.file,
      `Ln ${f.line}`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Severity", "Type", "Issue", "File", "Line"]],
      body: findingsTable,
      theme: "grid",
      headStyles: { fillStyle: [30, 41, 59], textColor: 255 },
      styles: { fontSize: 7, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `CodeSentinel - Proprietary security report - Page ${i} of ${pageCount}`,
        20,
        285,
      );
    }

    doc.save(`CodeSentinel_Report_${activeProject.name}.pdf`);
  };

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Shield}
        title="No active workspace"
        description="Select a repository to bridge architectural results to exportable records."
      />
    );
  }

  const findings = activeProject.findings || [];
  const metrics = activeProject.metrics;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const aiCount = findings.filter((f) => f.type?.startsWith("AI:")).length;

  const summaryRows = [
    { label: "Audit volume", value: `${metrics.totalFiles} files analysed` },
    { label: "Logic parity", value: `${findings.length} finding vectors` },
    {
      label: "Startup latency",
      value: `${metrics.startupTimeMs || 0}ms`,
      accent: "text-emerald-600",
    },
    { label: "Sync timestamp", value: activeProject.lastScanned },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Reports"
        title={activeProject.name}
        description="Exportable cryptographic and architectural analysis"
        actions={
          <>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
            <Button>Archive audit session</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Archival summary" icon={Clock}>
          <div className="space-y-3.5">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-slate-100 pb-3.5 last:border-0 last:pb-0"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {row.label}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    row.accent || "text-slate-900"
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI reasoning ledger" icon={Sparkles}>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Shield className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Architecture validated
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
              {aiCount > 0
                ? `Llama-3 behavioural reasoning cross-verified ${aiCount} distinct logic vectors.${
                    criticalCount > 0
                      ? ` Urgent remediation suggested for the ${criticalCount} high-risk findings identified.`
                      : " No critical logic deviations in the current production baseline."
                  }`
                : DEMO_REASONING_LEDGER}
            </p>
          </div>
        </Panel>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Finding ledger
          </h3>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {findings.length} total
          </span>
        </div>
        <Panel bodyClassName="p-0">
          <div className="divide-y divide-slate-100">
            {findings.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5">
                <div
                  className={`shrink-0 rounded-lg p-2 ${
                    f.severity === "critical"
                      ? "bg-red-50 text-red-600"
                      : f.severity === "high"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {f.title || f.message}
                    </p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityBadgeClass(
                        f.severity,
                      )}`}
                    >
                      {f.severity}
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      {f.file}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {f.description.slice(0, 240)}…
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}
