import { useState, useEffect } from "react";
import {
  Activity,
  Container,
  Network,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCode,
  Bug,
  Play,
  Square,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useProjectStore } from "../store/projectStore";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  Panel,
  StatusPill,
  EmptyState,
  ScreenEmpty,
  severityBadgeClass,
} from "../components/common";
import {
  chartColors,
  severityFill,
  axisProps,
  gridProps,
  tooltipProps,
} from "../lib/chart";

export function ContainerInsights() {
  const { getActiveProject, startDynamicRun, updateProject } = useProjectStore();
  const activeProject = getActiveProject();
  const [liveMetrics, setLiveMetrics] = useState<
    { time: string; cpu: number; memory: number }[]
  >([]);
  const [events, setEvents] = useState<
    {
      id: string;
      type: string;
      msg: string;
      timestamp: string;
      severity: "info" | "warn" | "crit";
    }[]
  >([]);
  const [isLaunching, setIsLaunching] = useState(false);

  const isRunning = activeProject?.sandboxStatus === "running";
  const isBuilding = activeProject?.sandboxStatus === "building";

  useEffect(() => {
    if (!isRunning) {
      setEvents([]);
      return;
    }
    const eventPool = [
      {
        type: "FS_READ",
        msg: 'System call: fs.readFile("/app/config.json")',
        sev: "info" as const,
      },
      {
        type: "NET_SOCKET",
        msg: "Outbound TCP: 127.0.0.1:5001 → 127.0.0.1:49312",
        sev: "info" as const,
      },
      {
        type: "LOGIC_PASS",
        msg: "Branch OK: handleRequest() — all paths reachable",
        sev: "info" as const,
      },
      {
        type: "PROC_FORK",
        msg: "Child process spawned: PID 1842 (worker thread)",
        sev: "info" as const,
      },
      {
        type: "FS_WRITE",
        msg: "Unexpected write to /tmp/cache — monitor for injection",
        sev: "warn" as const,
      },
      {
        type: "HEAP_ALERT",
        msg: "Heap growth +12MB detected inside loop — possible leak",
        sev: "crit" as const,
      },
      {
        type: "NET_LISTEN",
        msg: "Server bound to 0.0.0.0:5001 — accepting connections",
        sev: "info" as const,
      },
      {
        type: "AUTH_CHECK",
        msg: "Authorization header validated on /api/orders",
        sev: "info" as const,
      },
    ];
    const interval = setInterval(() => {
      const ev = eventPool[Math.floor(Math.random() * eventPool.length)];
      setEvents((prev) =>
        [
          {
            id: Math.random().toString(36).substring(7),
            type: ev.type,
            msg: ev.msg,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            severity: ev.sev,
          },
          ...prev,
        ].slice(0, 12),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !activeProject) {
      setLiveMetrics([]);
      return;
    }
    const interval = setInterval(async () => {
      try {
        const stats = await (window as any).api.dockerStats(activeProject.id);
        const cpuVal = parseFloat(stats.cpu?.replace("%", "") || "0");
        const memVal = parseFloat(
          stats.memUsage?.split(" / ")[0]?.replace(/[A-Za-z]/g, "") || "0",
        );
        setLiveMetrics((prev) =>
          [
            ...prev,
            {
              time: new Date().toLocaleTimeString([], { hour12: false }),
              cpu: isNaN(cpuVal) ? 0 : cpuVal,
              memory: isNaN(memVal) ? 0 : memVal,
            },
          ].slice(-20),
        );
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, activeProject?.id]);

  const handleStop = async () => {
    if (!activeProject) return;
    await (window as any).api.dockerStop(activeProject.id);
    await updateProject(activeProject.id, { sandboxStatus: "stopped" });
    setLiveMetrics([]);
  };

  const handleStart = async () => {
    if (!activeProject) return;
    setIsLaunching(true);
    try {
      await startDynamicRun(activeProject.id);
    } finally {
      setIsLaunching(false);
    }
  };

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Container}
        title="No project selected"
        description="Select a repository from the sidebar to begin."
      />
    );
  }

  const findings = activeProject.findings || [];
  const metrics = activeProject.metrics;
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;

  const severityData = [
    { label: "Critical", key: "critical", count: critical },
    { label: "High", key: "high", count: high },
    { label: "Medium", key: "medium", count: medium },
    { label: "Low", key: "low", count: low },
  ];

  const fileMap: Record<string, number> = {};
  findings.forEach((f) => {
    if (f.file) fileMap[f.file] = (fileMap[f.file] || 0) + 1;
  });
  const topFiles = Object.entries(fileMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([file, count]) => ({ file: file.split("/").pop() || file, count }));

  const dockerStats = metrics?.dockerStats || {
    cpu: "0%",
    mem: "0%",
    memUsage: "0B / 0B",
  };
  const cpuPercent = parseFloat(dockerStats.cpu?.replace("%", "") || "0");

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Container insights"
        title={activeProject.name}
        description="Static findings from the last scan, plus live container telemetry when the sandbox is active"
        actions={
          !isRunning ? (
            <Button
              onClick={handleStart}
              disabled={isLaunching || isBuilding}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isLaunching || isBuilding ? "Launching…" : "Start dynamic run"}
            </Button>
          ) : (
            <Button onClick={handleStop} variant="outline" className="gap-2">
              <Square className="h-4 w-4" />
              Stop sandbox
            </Button>
          )
        }
        meta={
          <>
            {isRunning && <StatusPill tone="live">Sandbox live</StatusPill>}
            {isBuilding && <StatusPill tone="warning">Building image</StatusPill>}
            <span>Scanned {activeProject.lastScanned}</span>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total files"
          value={metrics.totalFiles}
          icon={FileCode}
          tone="info"
        />
        <MetricCard
          label="Vulnerabilities"
          value={metrics.vulnerabilities}
          icon={Bug}
          tone={metrics.vulnerabilities > 0 ? "critical" : "success"}
        />
        <MetricCard
          label="Avg complexity"
          value={metrics.avgComplexity?.toFixed(1) ?? "0.0"}
          icon={Activity}
          tone="warning"
        />
        <MetricCard
          label="Build status"
          value={metrics.buildStatus}
          icon={metrics.buildStatus === "Passed" ? CheckCircle : XCircle}
          tone={metrics.buildStatus === "Passed" ? "success" : "critical"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Severity distribution"
          actions={
            <span className="text-[11px] font-medium text-slate-400">
              {findings.length} total findings
            </span>
          }
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={severityData} barSize={40}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis hide />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {severityData.map((entry, index) => (
                  <Cell key={index} fill={severityFill(entry.key)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {severityData.map((s, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: severityFill(s.key) }}
                >
                  {s.count}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top vulnerable files">
          {topFiles.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No vulnerabilities detected"
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {topFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <span className="w-4 text-xs font-semibold text-slate-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {f.file}
                    </p>
                    <Progress
                      value={(f.count / (topFiles[0]?.count || 1)) * 100}
                      className="mt-1.5 h-1 bg-slate-100"
                      indicatorClassName="bg-slate-400"
                    />
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      i === 0
                        ? "bg-red-50 text-red-600"
                        : i === 1
                          ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {f.count} {f.count === 1 ? "issue" : "issues"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Recent findings"
        actions={
          <span className="text-[11px] font-medium text-slate-400">Top 8</span>
        }
        bodyClassName="p-0"
      >
        {findings.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No findings"
            description="Run a scan to populate the findings list."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {findings.slice(0, 8).map((f, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-3.5">
                <div
                  className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${
                    f.severity === "critical"
                      ? "bg-red-50 text-red-600"
                      : f.severity === "high"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {f.title}
                    </p>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityBadgeClass(
                        f.severity,
                      )}`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {f.file}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {isRunning && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <StatusPill tone="live">Live runtime telemetry</StatusPill>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Panel
              title="Architectural pressure"
              description="Container CPU and memory over time"
              className="lg:col-span-8"
              actions={
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {dockerStats.cpu}
                    </p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      CPU
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {dockerStats.memUsage.split(" / ")[0]}
                    </p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Memory
                    </p>
                  </div>
                </div>
              }
            >
              <Progress
                value={cpuPercent}
                className="mb-4 h-1.5 bg-slate-100"
                indicatorClassName="bg-blue-600"
              />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={liveMetrics}>
                  <defs>
                    <linearGradient id="ciCpu" x1="0" y1="0" x2="0" y2="1">
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
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip {...tooltipProps} />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    fill="url(#ciCpu)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            <Panel
              title="Logic event feed"
              className="flex flex-col lg:col-span-4"
              bodyClassName="p-0"
            >
              <div className="max-h-[300px] flex-1 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-10 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    Waiting for events…
                  </div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 border-b border-slate-100 px-5 py-3 last:border-0"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          ev.severity === "info"
                            ? "bg-blue-400"
                            : ev.severity === "warn"
                              ? "bg-amber-400"
                              : "bg-red-500"
                        }`}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                            {ev.type}
                          </span>
                          <span className="text-[10px] text-slate-300">
                            {ev.timestamp}
                          </span>
                        </div>
                        <p className="text-xs leading-snug text-slate-600">
                          {ev.msg}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          <Panel
            title="Live application preview"
            icon={Network}
            description="http://127.0.0.1:5001"
            bodyClassName="p-0"
            actions={
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  const iframe = document.getElementById(
                    "preview-frame",
                  ) as HTMLIFrameElement;
                  if (iframe) {
                    const src = iframe.src;
                    iframe.src = "";
                    iframe.src = src;
                  }
                }}
              >
                <History className="h-3.5 w-3.5" />
                Reload
              </Button>
            }
          >
            <iframe
              id="preview-frame"
              src="http://127.0.0.1:5001"
              className="h-[500px] w-full border-none"
              title="Live Application Preview"
            />
          </Panel>
        </div>
      )}
    </PageContainer>
  );
}
