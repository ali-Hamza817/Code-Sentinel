import { Shield, BarChart3, Activity, AlertTriangle, Sparkles } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import {
  PageContainer,
  PageHeader,
  Panel,
  StatusPill,
  ScreenEmpty,
} from "../components/common";
import { chartColors } from "../lib/chart";

function CircularProgress({ score, max }: { score: number; max: number }) {
  const percentage = (score / max) * 100;
  const circumference = 2 * Math.PI * 120;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 70
      ? chartColors.success
      : percentage >= 40
        ? chartColors.medium
        : chartColors.critical;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="240" height="240" className="-rotate-90">
        <circle
          cx="120"
          cy="120"
          r="104"
          stroke="#e2e8f0"
          strokeWidth="14"
          fill="none"
        />
        <circle
          cx="120"
          cy="120"
          r="104"
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeDasharray={2 * Math.PI * 104}
          strokeDashoffset={
            2 * Math.PI * 104 - (percentage / 100) * (2 * Math.PI * 104)
          }
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {score}
        </span>
        <span className="text-sm text-slate-500">out of {max}</span>
      </div>
    </div>
  );
}

export function RiskScoring() {
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Shield}
        title="No active workspace"
        description="Select a project to view its architectural risk scores."
      />
    );
  }

  const vulnerabilities = activeProject.metrics?.vulnerabilities || 0;
  const totalFiles = activeProject.metrics?.totalFiles || 1;
  const avgComplexity = activeProject.metrics?.avgComplexity || 0;

  const vScore = Math.max(0, 100 - vulnerabilities * 10);
  const cScore = Math.max(0, 100 - avgComplexity * 5);
  const rScore = activeProject.status === "completed" ? 95 : 50;

  const overallScore = Math.round(vScore * 0.5 + cScore * 0.3 + rScore * 0.2);

  const scoreBreakdown = [
    {
      category: "Vulnerability score",
      score: vScore,
      icon: Shield,
      description: `${vulnerabilities} security issues across ${totalFiles} source files`,
    },
    {
      category: "Complexity score",
      score: Math.round(cScore),
      icon: BarChart3,
      description: `Average cyclomatic complexity of ${avgComplexity.toFixed(1)}`,
    },
    {
      category: "Analysis quality",
      score: rScore,
      icon: Activity,
      description:
        activeProject.status === "completed"
          ? "Full workspace audit completed successfully"
          : "Analysis pending or interrupted",
    },
  ];

  const barColor = (score: number) =>
    score < 50
      ? "bg-red-500"
      : score < 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  const risk =
    overallScore >= 80
      ? { label: "Low risk", tone: "success" as const }
      : overallScore >= 50
        ? { label: "Moderate risk", tone: "warning" as const }
        : { label: "Critical risk", tone: "danger" as const };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Risk scoring"
        title={activeProject.name}
        description="Security and quality assessment for the active workspace"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Project health index" className="lg:col-span-1">
          <div className="flex flex-col items-center py-4">
            <CircularProgress score={overallScore} max={100} />
            <StatusPill tone={risk.tone} className="mt-6">
              {risk.label}
            </StatusPill>
          </div>
        </Panel>

        <Panel title="Component breakdown" className="lg:col-span-2">
          <div className="space-y-6">
            {scoreBreakdown.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="space-y-2.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.category}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-semibold tabular-nums text-slate-900">
                      {item.score}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor(
                        item.score,
                      )}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="AI reasoning summary" icon={Sparkles}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-slate-200 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Primary security driver
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">
              {vulnerabilities > 0
                ? `Scanners identified ${vulnerabilities} distinct architectural weaknesses. High-severity patterns in critical modules are the primary drivers of technical debt.`
                : "Strong security posture. No common architectural vulnerabilities were detected in the initial scan."}
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Activity className="h-4 w-4 text-blue-500" />
              Codebase scalability
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">
              {avgComplexity > 15
                ? `Mean cyclomatic complexity is high (${avgComplexity.toFixed(
                    1,
                  )}), indicating a maintenance-heavy codebase with potential architectural drift.`
                : `Complexity is within healthy limits (${avgComplexity.toFixed(
                    1,
                  )}). The codebase is architecturally resilient and maintainable.`}
            </p>
          </div>
        </div>
      </Panel>
    </PageContainer>
  );
}
