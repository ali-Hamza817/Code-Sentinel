import { useState } from "react";
import {
  Shield,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useProjectStore } from "../store/projectStore";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  ScreenEmpty,
  severityBadgeClass,
} from "../components/common";

function VulnerabilityCard({ vulnerability }: { vulnerability: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAI = vulnerability.type?.startsWith("AI:");

  const Icon =
    vulnerability.severity === "critical"
      ? AlertCircle
      : vulnerability.severity === "high"
        ? AlertTriangle
        : isAI
          ? Sparkles
          : Info;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300">
      <div className="p-5">
        <button
          type="button"
          className="flex w-full items-start gap-4 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div
            className={`shrink-0 rounded-lg p-2 ${
              vulnerability.severity === "critical"
                ? "bg-red-50 text-red-600"
                : vulnerability.severity === "high"
                  ? "bg-amber-50 text-amber-600"
                  : isAI
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-500"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {vulnerability.title || vulnerability.message}
                </h3>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${severityBadgeClass(
                    vulnerability.severity,
                  )}`}
                >
                  {vulnerability.severity}
                </span>
                {isAI && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    <Sparkles className="h-3 w-3" />
                    AI verified
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              )}
            </div>

            <p className="mb-3 text-sm leading-relaxed text-slate-600">
              {vulnerability.description.replace("[DEEP REASONING] ", "")}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono lowercase">
                {vulnerability.file || "global context"}
              </span>
              {vulnerability.line > 0 && <span>Line {vulnerability.line}</span>}
              <span className="font-medium uppercase tracking-wide text-slate-400">
                {vulnerability.type}
              </span>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Terminal className="h-3.5 w-3.5" />
                  Code context
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
                  <code className="text-blue-300">
                    {vulnerability.snippet || "// No additional context available"}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Remediation plan
                </h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {isAI
                    ? vulnerability.description.split("]")[1] ||
                      vulnerability.description
                    : vulnerability.description}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Silence finding
              </Button>
              <Button size="sm">Apply fix</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Vulnerabilities() {
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();
  const [search, setSearch] = useState("");

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Shield}
        title="No active workspace"
        description="Connect a repository to audit vulnerabilities."
      />
    );
  }

  const findings = (activeProject.findings || []).filter(
    (f) =>
      f.message?.toLowerCase().includes(search.toLowerCase()) ||
      f.type?.toLowerCase().includes(search.toLowerCase()),
  );

  const criticalCount = findings.filter((v) => v.severity === "critical").length;
  const aiCount = findings.filter((v) => v.type?.startsWith("AI:")).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Vulnerabilities"
        title={activeProject.name}
        description="Detected architectural weaknesses in the active workspace"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter findings…"
              className="w-64 rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Critical risks"
          value={criticalCount}
          icon={AlertCircle}
          tone="critical"
        />
        <MetricCard
          label="AI reasoning"
          value={aiCount}
          icon={Sparkles}
          tone="info"
        />
        <MetricCard
          label="Total findings"
          value={findings.length}
          icon={Shield}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Active audit trail
          </h3>
          <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Identified: {findings.length}</span>
            <span className="text-blue-600">Deep reasoning: {aiCount}</span>
          </div>
        </div>

        {findings.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No vulnerabilities detected"
            description="The heuristic pass is complete and found no architectural weaknesses."
          />
        ) : (
          <div className="space-y-4">
            {findings.map((vulnerability, idx) => (
              <VulnerabilityCard key={idx} vulnerability={vulnerability} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
