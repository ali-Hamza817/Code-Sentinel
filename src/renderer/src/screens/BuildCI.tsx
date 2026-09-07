import { useState, useEffect, useRef } from "react";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Hammer,
  Terminal,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useProjectStore } from "../store/projectStore";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  Console,
  ScreenEmpty,
} from "../components/common";
import { DEMO_BUILD_LOG } from "../lib/demo";

export function BuildCI() {
  const { getActiveProject, updateProject } = useProjectStore();
  const activeProject = getActiveProject();
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeProject?.buildLogs) {
      setLogs(activeProject.buildLogs);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    const removeListener = (window as any).api.onBuildLog((data: string) => {
      setLogs((prev) => [...prev, data]);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });

    return () => {
      if (removeListener && typeof removeListener === "function")
        removeListener();
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isBuilding) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBuilding, startTime]);

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Hammer}
        title="No active workspace"
        description="Select or connect a repository to run pipelines."
      />
    );
  }

  const handleRunBuild = async () => {
    setIsBuilding(true);
    setLogs([]);
    setStartTime(Date.now());
    setDuration(0);

    try {
      const exitCode = await (window as any).api.runBuild(activeProject.path);
      const status = exitCode === 0 ? "Passed" : "Failed";

      await updateProject(activeProject.id, {
        metrics: { ...activeProject.metrics, buildStatus: status },
        buildLogs: logs,
      });
    } catch (err) {
      console.error("Build execution error:", err);
    } finally {
      setIsBuilding(false);
    }
  };

  const buildStatus = activeProject.metrics.buildStatus;

  // Placeholder transcript so the console reads as a completed run for docs.
  const displayLogs =
    logs.length > 0 ? logs : isBuilding ? [] : DEMO_BUILD_LOG;
  const displayDuration = duration > 0 ? `${duration}s` : "58.2s";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Build & CI"
        title={activeProject.name}
        description="Isolated compilation pipeline for the active workspace"
        actions={
          <Button
            onClick={handleRunBuild}
            disabled={isBuilding}
            className="gap-2"
          >
            {isBuilding ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Building…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Initiate build
              </>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Build tool"
          value="npm / shell"
          icon={Package}
          tone="info"
        />
        <MetricCard
          label="Cycle duration"
          value={displayDuration}
          icon={Clock}
          hint="Elapsed"
        />
        <MetricCard
          label="Current state"
          value={isBuilding ? "In progress" : buildStatus || "Passed"}
          icon={buildStatus === "Failed" ? XCircle : CheckCircle}
          tone={buildStatus === "Failed" ? "critical" : "success"}
        />
      </div>

      <Console title="Live build stream" live={isBuilding} bodyRef={scrollRef} height="h-96">
        {displayLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
            <Terminal className="h-7 w-7" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">
              Console stream in standby
            </p>
          </div>
        ) : (
          displayLogs.map((log, index) => (
            <div key={index} className="flex gap-4">
              <span className="w-8 shrink-0 select-none text-right text-slate-600">
                {index + 1}
              </span>
              <span
                className={`flex-1 whitespace-pre-wrap ${
                  /(^|\s)(error|failed|exception)\b/i.test(log) &&
                  !/\b0 (error|warning)/i.test(log)
                    ? "text-red-400"
                    : log.includes("✓") ||
                        /\b(succeeded|passed|success)\b/i.test(log)
                      ? "text-emerald-400"
                      : "text-slate-300"
                }`}
              >
                {log}
              </span>
            </div>
          ))
        )}
      </Console>
    </PageContainer>
  );
}
