import { useState } from "react";
import { FolderGit2, Upload, Clock, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useProjectStore } from "../store/projectStore";
import { toast } from "sonner";
import {
  PageContainer,
  PageHeader,
  Panel,
  EmptyState,
} from "../components/common";

export function Repository() {
  const [repoUrl, setRepoUrl] = useState("");
  const {
    projects,
    addProject,
    uploadSingleFile,
    setActiveProject,
    removeProject,
  } = useProjectStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!repoUrl) return;

    setIsConnecting(true);
    try {
      const repoName = repoUrl.split("/").pop() || "new-project";
      await addProject({
        name: repoName,
        url: repoUrl,
        path: "",
      });
      setRepoUrl("");
      toast.success(`Project ${repoName} initialized for analysis!`);
    } catch (err: any) {
      toast.error(
        err.message || "Failed to connect repository. Check if the URL is valid.",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this project? Data and local workspace will be removed.",
      )
    ) {
      await removeProject(id);
      toast.success("Project removed successfully");
    }
  };

  const getLanguageIcon = (ext?: string) => {
    const e = ext?.toLowerCase();
    if (["py"].includes(e || ""))
      return <span className="text-xs font-semibold text-blue-500">PY</span>;
    if (["js", "ts", "tsx", "jsx"].includes(e || ""))
      return <span className="text-xs font-semibold text-amber-500">JS</span>;
    if (["cs"].includes(e || ""))
      return <span className="text-xs font-semibold text-slate-500">C#</span>;
    if (["java"].includes(e || ""))
      return <span className="text-xs font-semibold text-red-500">JV</span>;
    if (["go"].includes(e || ""))
      return <span className="text-xs font-semibold text-cyan-500">GO</span>;
    return <FolderGit2 className="h-5 w-5 text-slate-400" />;
  };

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Repository"
        title="Workspace"
        description="Manage project repositories and standalone code experiments"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Connect repository" icon={FolderGit2}>
          <p className="mb-4 text-sm text-slate-500">
            Analyse a full GitHub project.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="h-10 bg-slate-50 text-sm"
            />
            <Button
              onClick={handleConnect}
              disabled={!repoUrl || isConnecting}
              className="w-full"
            >
              {isConnecting ? "Connecting…" : "Initialize repo audit"}
            </Button>
          </div>
        </Panel>

        <Panel title="Single file audit" icon={Upload}>
          <p className="mb-4 text-sm text-slate-500">
            Isolated analysis and containerisation.
          </p>
          <button
            type="button"
            onClick={() => uploadSingleFile()}
            className="flex h-[92px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="rounded-lg bg-slate-100 p-2">
              <Upload className="h-4 w-4 text-slate-500" />
            </div>
            <span className="text-xs font-medium">
              Pick source file (Python, C#, Java…)
            </span>
          </button>
        </Panel>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Project ledger
          </h3>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {projects.length} active
          </span>
        </div>

        {projects.length === 0 ? (
          <EmptyState icon={FolderGit2} title="Workspace empty" />
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveProject(project.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setActiveProject(project.id);
                }}
                className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {project.type === "file" ? (
                      getLanguageIcon(project.fileExtension)
                    ) : (
                      <FolderGit2 className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-semibold text-slate-900">
                        {project.name}
                      </h4>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {project.type === "file" ? "Standalone" : "Repository"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {project.url}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Violations
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-red-600">
                      {project.metrics?.vulnerabilities ?? 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Complexity
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                      {project.metrics?.avgComplexity?.toFixed(1) ?? "0.0"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{project.lastScanned}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, project.id)}
                      className="h-9 w-9 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
