import {
  FileCode,
  Shield,
  BarChart3,
  CheckCircle,
  Sparkles,
  Activity,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useProjectStore } from "../store/projectStore";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  Panel,
  ScreenEmpty,
} from "../components/common";
import { chartColors, severityFill, tooltipProps } from "../lib/chart";
import { DEMO_AI_INSIGHTS, DEMO_SECURITY_SUMMARY } from "../lib/demo";

export function Dashboard() {
  const {
    projects,
    activeProjectId,
    reScanProject,
    updateProject,
    scanProgress,
    scanningFile,
    estimatedRemainingSeconds,
  } = useProjectStore();

  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Shield}
        title="No active workspace"
        description="Select or connect a repository to generate analytics."
      />
    );
  }

  const metrics = activeProject.metrics;
  const findings = activeProject.findings || [];
  const isScanning =
    activeProject.status === "scanning" || activeProject.status === "cloning";
  const isFailed = activeProject.status === "failed";

  // Self-healing deep audit: re-clone if path is missing
  const handleDeepAudit = async () => {
    if (!activeProject.path) {
      try {
        updateProject(activeProject.id, { status: "cloning" });
        const cloneData = await (window as any).api.cloneRepo(activeProject.url);
        updateProject(activeProject.id, {
          path: cloneData.localPath,
          status: "scanning",
        });
        await reScanProject(activeProject.id);
      } catch (err: any) {
        updateProject(activeProject.id, { status: "failed" });
        alert(
          `Clone failed: ${err?.message || "Unknown error"}. Check the repo URL.`,
        );
      }
    } else {
      reScanProject(activeProject.id);
    }
  };

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter(
    (f) => f.severity === "low" || f.severity === "info",
  ).length;

  const vulnerabilityData = [
    { name: "Critical", value: criticalCount, color: severityFill("critical") },
    { name: "High", value: highCount, color: severityFill("high") },
    { name: "Medium", value: mediumCount, color: severityFill("medium") },
    { name: "Low", value: lowCount, color: severityFill("low") },
  ].filter((d) => d.value > 0);

  if (vulnerabilityData.length === 0) {
    vulnerabilityData.push({
      name: "Secure",
      value: 1,
      color: chartColors.success,
    });
  }

  const statsCards = [
    {
      label: "Total files",
      value: (metrics?.totalFiles || 0).toLocaleString(),
      icon: FileCode,
      tone: "info" as const,
    },
    {
      label: "Vulnerabilities",
      value: findings.length.toString(),
      icon: Shield,
      tone: (findings.length > 0 ? "critical" : "success") as const,
    },
    {
      label: "Avg complexity",
      value: (metrics?.avgComplexity || 0).toFixed(1),
      icon: BarChart3,
      tone: "warning" as const,
    },
    {
      label: "Build status",
      value: metrics?.buildStatus || "Standby",
      icon: CheckCircle,
      tone: (metrics?.buildStatus === "Passed"
        ? "success"
        : "default") as const,
    },
  ];

  const realAiInsights = findings
    .filter((f) => f.type?.startsWith("AI:"))
    .slice(0, 3)
    .map((f) => ({
      severity: f.severity,
      title: f.title.replace("AI: ", ""),
      description: f.description
        .replace("[DEEP REASONING] ", "")
        .slice(0, 180),
    }));

  const aiInsights =
    realAiInsights.length > 0 ? realAiInsights : DEMO_AI_INSIGHTS;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Dashboard"
        title={activeProject.name}
        description="Security analytics and performance overview"
        actions={
          <Button onClick={handleDeepAudit} disabled={isScanning} className="gap-2">
            {isScanning ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {activeProject.status === "cloning" ? "Cloning…" : "Reasoning…"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isFailed ? "Retry audit" : "Deep audit"}
              </>
            )}
          </Button>
        }
        meta={
          <>
            <span>Lumina Engine v4.0</span>
            <span className="text-slate-300">·</span>
            <span>Updated {activeProject.lastScanned}</span>
          </>
        }
      />

      {scanProgress > 0 && scanProgress < 100 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Deep reasoning in progress
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                {scanningFile}
              </p>
            </div>
            <div className="flex items-center gap-6 pl-4 text-right">
              {estimatedRemainingSeconds !== null && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Est. remaining
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {Math.floor(estimatedRemainingSeconds / 60)}:
                    {(estimatedRemainingSeconds % 60)
                      .toString()
                      .padStart(2, "0")}
                  </p>
                </div>
              )}
              <span className="font-mono text-sm font-semibold text-blue-600">
                {scanProgress}%
              </span>
            </div>
          </div>
          <Progress
            value={scanProgress}
            className="mt-3 h-1.5 bg-blue-100"
            indicatorClassName="bg-blue-600"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Vulnerability distribution" icon={Activity}>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vulnerabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={58}
                  outerRadius={88}
                  dataKey="value"
                  paddingAngle={vulnerabilityData.length > 1 ? 3 : 0}
                  isAnimationActive={false}
                  stroke="none"
                >
                  {vulnerabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {vulnerabilityData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs font-medium text-slate-500">
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI insights" icon={Sparkles}>
          <div className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div
                  className={`rounded-lg p-2 ${
                    insight.severity === "critical"
                      ? "bg-red-50 text-red-600"
                      : insight.severity === "high"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {insight.title}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Security summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {findings.length > 0
                ? `Audit identified ${findings.length} total risk ${
                    findings.length === 1 ? "vector" : "vectors"
                  }.${
                    criticalCount > 0
                      ? ` ${criticalCount} critical logic ${
                          criticalCount === 1
                            ? "flaw requires"
                            : "flaws require"
                        } immediate review.`
                      : " The architecture shows a strong security posture on the initial pass."
                  }`
                : DEMO_SECURITY_SUMMARY}
            </p>
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}
