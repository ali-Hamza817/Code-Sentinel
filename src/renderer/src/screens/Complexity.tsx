import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  ShieldAlert,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useProjectStore } from "../store/projectStore";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  Panel,
  StatusPill,
  ScreenEmpty,
} from "../components/common";
import { chartColors, axisProps, gridProps, tooltipProps } from "../lib/chart";
import { DEMO_HIGH_RISK_FUNCTIONS } from "../lib/demo";

// Simulated historical growth trend — in a real app this would come from a DB
const complexityTrend = [
  { date: "Day 1", complexity: 8, branches: 12 },
  { date: "Day 2", complexity: 12, branches: 24 },
  { date: "Day 3", complexity: 15, branches: 32 },
  { date: "Day 4", complexity: 14, branches: 28 },
  { date: "Day 5", complexity: 19, branches: 45 },
  { date: "Current", complexity: 22, branches: 54 },
];

export function Complexity() {
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={BarChart3}
        title="No active workspace"
        description="Select a project workspace to activate cyclomatic telemetry."
      />
    );
  }

  const metrics = activeProject.metrics;
  const highRiskFns =
    metrics.highRiskFunctions && metrics.highRiskFunctions.length > 0
      ? metrics.highRiskFunctions
      : DEMO_HIGH_RISK_FUNCTIONS;

  const avgCC = metrics.avgComplexity || 0;
  const isHighRisk = avgCC > 15;
  const isCritical = avgCC > 25;

  const riskLabel = isCritical ? "Critical" : isHighRisk ? "Elevated" : "Low";
  const riskStatus = isCritical
    ? "Unstable"
    : isHighRisk
      ? "Degrading"
      : "Stable";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Complexity"
        title={activeProject.name}
        description="Branching pathways and cognitive complexity across the codebase"
        meta={
          <>
            <StatusPill tone="live">Live engine</StatusPill>
            <span className="text-slate-300">·</span>
            <span>Scanned {activeProject.lastScanned}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Average complexity"
          value={avgCC.toFixed(1)}
          icon={BarChart3}
          tone="info"
          hint="Mean pathway density"
        />
        <MetricCard
          label="Risk factor"
          value={riskLabel}
          icon={TrendingUp}
          tone={isCritical ? "critical" : isHighRisk ? "warning" : "success"}
          hint={`Systemic logic stability — ${riskStatus.toLowerCase()}`}
        />
        <MetricCard
          label="Decision branches"
          value={metrics.totalBranches || 0}
          icon={ShieldAlert}
          hint="Atomic decision points"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel
          title="Branching trend"
          description="Evolution of logic density over recent scans"
          className="lg:col-span-7"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complexityTrend}>
                <defs>
                  <linearGradient id="ccGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColors.primary}
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColors.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Area
                  type="monotone"
                  dataKey="complexity"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  fill="url(#ccGradient)"
                  isAnimationActive={false}
                  dot={{
                    fill: chartColors.primary,
                    stroke: "#fff",
                    strokeWidth: 2,
                    r: 3,
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="High-risk functions"
          description="Cyclomatic hot-spots"
          className="flex flex-col lg:col-span-5"
          bodyClassName="p-0 flex flex-1 flex-col"
        >
          <div className="min-h-[200px] flex-1 divide-y divide-slate-100 overflow-y-auto">
            {highRiskFns.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
                <p className="text-xs font-medium text-slate-500">
                  System logic optimised
                </p>
              </div>
            ) : (
              highRiskFns.map((fn, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                      {fn.score > 20 && (
                        <Flame className="h-3 w-3 text-amber-500" />
                      )}
                      {fn.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs text-slate-400">
                        {fn.file}
                      </span>
                      <span className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-medium text-slate-500">
                        Ln {fn.line}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        fn.score > 20
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      CC {fn.score}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto space-y-2 border-t border-slate-800 bg-slate-950 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Refactoring advice
            </p>
            <p className="text-xs leading-relaxed text-slate-300">
              {isCritical
                ? "High cyclomatic density detected across core modules. Recommend immediate decomposition of the largest branches."
                : highRiskFns.length > 0
                  ? `Module “${highRiskFns[0].name}” exceeds the CC safety baseline. Recommend extracting its logical branches.`
                  : "Architecture is lean. No critical maintenance debt detected."}
            </p>
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}
