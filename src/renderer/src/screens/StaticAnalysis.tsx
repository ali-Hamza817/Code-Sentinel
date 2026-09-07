import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Code2,
  ShieldCheck,
  BrainCircuit,
  Zap,
  Lightbulb
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useProjectStore, ScanFinding } from "../store/projectStore";
import { Input } from "../components/ui/input";
import { ScreenEmpty, severityBadgeClass } from "../components/common";
import { DEMO_STATIC_FILES, demoCodeFor } from "../lib/demo";

// Build tree from flat file paths
const buildFileTree = (paths: string[], rootPath: string) => {
  const tree: any[] = [];
  paths.forEach(fullPath => {
    const relPath = fullPath.replace(rootPath, "").replace(/^[\\/]/, "");
    const parts = relPath.split(/[\\/]/);
    let currentLevel = tree;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let existing = currentLevel.find((item: any) => item.name === part);
      if (!existing) {
        existing = { name: part, path: fullPath, type: isLast ? 'file' : 'folder', children: isLast ? undefined : [] };
        currentLevel.push(existing);
      }
      if (!isLast) currentLevel = existing.children;
    });
  });
  const sortTree = (nodes: any[]): any[] =>
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(node => { if (node.children) node.children = sortTree(node.children); return node; });
  return sortTree(tree);
};

function FileTreeItem({ item, level = 0, onSelect, selectedPath, findingCount }: {
  item: any; level?: number; onSelect: (path: string) => void;
  selectedPath: string | null; findingCount: number;
}) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isSelected = selectedPath === item.path;

  if (item.type === "file") {
    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors ${isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"}`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => onSelect(item.path)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <File className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
          <span className={`text-xs truncate ${isSelected ? "font-semibold" : ""}`}>{item.name}</span>
        </div>
        {findingCount > 0 && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${findingCount >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {findingCount}
          </span>
        )}
      </div>
    );
  }
  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
        <Folder className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-700">{item.name}</span>
      </div>
      {isOpen && item.children && (
        <div>
          {item.children.map((child: any, i: number) => (
            <FileTreeItem key={i} item={child} level={level + 1}
              onSelect={onSelect} selectedPath={selectedPath}
              findingCount={findingCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical' || severity === 'high') return <AlertCircle className="w-4 h-4" />;
  if (severity === 'medium') return <AlertTriangle className="w-4 h-4" />;
  return <Info className="w-4 h-4" />;
}

export function StaticAnalysis() {
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [fileFindings, setFileFindings] = useState<ScanFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const allFindings = activeProject?.findings || [];

  // Count findings per file basename
  const findingCountByFile = useMemo(() => {
    const counts: Record<string, number> = {};
    allFindings.forEach(f => {
      const name = f.file?.split(/[\\/]/).pop() || '';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [allFindings]);

  const treeData = useMemo(() => {
    if (!activeProject || files.length === 0) return [];
    return buildFileTree(files, activeProject.path);
  }, [files, activeProject]);

  const filteredTree = useMemo(() => {
    if (!searchQuery) return treeData;
    const q = searchQuery.toLowerCase();
    const filterNodes = (nodes: any[]): any[] =>
      nodes.reduce((acc: any[], node) => {
        if (node.type === 'file' && node.name.toLowerCase().includes(q)) acc.push(node);
        else if (node.children) {
          const filtered = filterNodes(node.children);
          if (filtered.length > 0) acc.push({ ...node, children: filtered });
        }
        return acc;
      }, []);
    return filterNodes(treeData);
  }, [treeData, searchQuery]);

  useEffect(() => {
    if (activeProject?.demo || activeProject?.path) loadFiles();
  }, [activeProject?.id]);

  const loadFiles = async () => {
    try {
      if (activeProject?.demo) {
        setFiles(DEMO_STATIC_FILES);
        handleFileSelect(
          DEMO_STATIC_FILES.find((f) => f.endsWith("prompt_builder.py")) ??
            DEMO_STATIC_FILES[0],
        );
        return;
      }
      const allFiles = await (window as any).api.getFiles(activeProject?.path);
      setFiles(allFiles || []);
      if (allFiles?.length > 0) handleFileSelect(allFiles[0]);
    } catch (err) {
      console.error("Failed to load files:", err);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoading(true);
    try {
      const content = activeProject?.demo
        ? demoCodeFor(filePath)
        : await (window as any).api.readFile(filePath);
      setCode(content || '');

      // Match findings from the global deep-audit store for this specific file
      const fileName = filePath.split(/[\\/]/).pop() || '';
      const matched = allFindings.filter(f => {
        const fName = (f.file || '').split(/[\\/]/).pop() || '';
        return fName === fileName || (f.file && filePath.includes(f.file)) || (f.file && f.file.includes(fileName));
      });
      setFileFindings(matched);
    } catch (err) {
      console.error("Failed to read file:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <ScreenEmpty
        icon={Code2}
        title="No active workspace"
        description="Connect a repository to start per-file static analysis with Llama 3.2."
      />
    );
  }

  const critical = fileFindings.filter(f => f.severity === 'critical').length;
  const high = fileFindings.filter(f => f.severity === 'high').length;
  const aiFindings = fileFindings.filter(f => f.type?.startsWith('AI:'));
  const patternFindings = fileFindings.filter(f => !f.type?.startsWith('AI:'));

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Static analysis
          </p>
          <h1 className="text-base font-semibold text-slate-900">
            {activeProject.name}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            LLM-powered code audit · {allFindings.length} total findings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="gap-1 rounded-md border-transparent bg-blue-50 text-[11px] font-semibold text-blue-700">
            <BrainCircuit className="h-3 w-3" /> Llama 3.2
          </Badge>
          <Badge
            variant="outline"
            className="rounded-md text-[11px] font-semibold text-slate-500"
          >
            {files.length} files
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Explorer */}
        <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/30 shrink-0">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white border-slate-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredTree.map((item, i) => (
              <FileTreeItem
                key={i} item={item}
                onSelect={handleFileSelect}
                selectedPath={selectedFile}
                findingCount={findingCountByFile[item.name] || 0}
              />
            ))}
          </div>
        </div>

        {/* Center: Code Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto bg-slate-950">
            {/* File tab */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2 bg-slate-900 border-b border-slate-800">
              <File className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono text-slate-300">
                {selectedFile ? selectedFile.split(/[\\/]/).pop() : "Select a file"}
              </span>
              {fileFindings.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  {critical > 0 && <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{critical} CRITICAL</span>}
                  {high > 0 && <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{high} HIGH</span>}
                </div>
              )}
              {isLoading && <div className="ml-auto w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            {/* Code */}
            <div className="p-6">
              <pre className="text-xs font-mono leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap">
                <code>{code || "// Select a file from the explorer to view its code and AI findings."}</code>
              </pre>
            </div>
          </div>

          {/* Bottom: Findings Panel */}
          <div className="h-80 border-t border-slate-200 flex flex-col bg-white shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Findings for this file
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {fileFindings.length}
                </span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <BrainCircuit className="h-3 w-3 text-blue-500" />
                  {aiFindings.length} AI
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-slate-400" />
                  {patternFindings.length} pattern
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {fileFindings.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                  <ShieldCheck className="h-9 w-9" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide">
                    No issues found in this file
                  </p>
                  {activeProject.status === "scanning" && (
                    <p className="text-[11px] text-blue-500">
                      Deep audit running — findings appear when complete
                    </p>
                  )}
                </div>
              ) : (
                fileFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-slate-300"
                  >
                    <div
                      className={`shrink-0 rounded-lg p-1.5 ${
                        finding.severity === "critical"
                          ? "bg-red-50 text-red-600"
                          : finding.severity === "high" ||
                              finding.severity === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <SeverityIcon severity={finding.severity} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityBadgeClass(
                            finding.severity,
                          )}`}
                        >
                          {finding.severity}
                        </span>
                        {finding.type?.startsWith("AI:") && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600">
                            <BrainCircuit className="h-3 w-3" /> AI expert
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-400">
                          Line {finding.line}
                        </span>
                      </div>
                      <p className="mb-1 text-sm font-semibold text-slate-900">
                        {finding.title}
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600">
                        {finding.description}
                      </p>
                      {finding.affectedCode && (
                        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-2">
                          <code className="block overflow-x-auto whitespace-pre font-mono text-[10px] text-emerald-400">
                            {finding.affectedCode}
                          </code>
                        </div>
                      )}
                      {finding.suggestedFix && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <p className="text-[11px] font-medium leading-relaxed text-blue-800">
                            Fix: {finding.suggestedFix}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
