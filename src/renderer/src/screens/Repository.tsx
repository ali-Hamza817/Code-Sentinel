import { useState } from "react";
import { FolderGit2, Upload, Clock, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { useProjectStore } from "../store/projectStore";
import { toast } from "sonner";

export function Repository() {
  const [repoUrl, setRepoUrl] = useState("");
  const { projects, addProject, uploadSingleFile, setActiveProject, removeProject } = useProjectStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!repoUrl) return;
    
    setIsConnecting(true);
    try {
      const repoName = repoUrl.split('/').pop() || 'new-project';
      await addProject({
        name: repoName,
        url: repoUrl,
        path: "",
      });
      setRepoUrl("");
      toast.success(`Project ${repoName} initialized for analysis!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect repository. check if URL is valid.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? Data and local workspace will be removed.")) {
      await removeProject(id);
      toast.success("Project removed successfully");
    }
  };

  const getLanguageIcon = (ext?: string) => {
    const e = ext?.toLowerCase();
    if (['py'].includes(e || '')) return <span className="text-[10px] font-black text-blue-500">PY</span>;
    if (['js', 'ts', 'tsx', 'jsx'].includes(e || '')) return <span className="text-[10px] font-black text-yellow-500">JS</span>;
    if (['cs'].includes(e || '')) return <span className="text-[10px] font-black text-purple-500">C#</span>;
    if (['java'].includes(e || '')) return <span className="text-[10px] font-black text-red-500">JV</span>;
    if (['go'].includes(e || '')) return <span className="text-[10px] font-black text-cyan-500">GO</span>;
    return <FolderGit2 className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 bg-[#FAFAFB] min-h-screen font-sans">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Workspace Orchestrator</h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Manage your project repositories and standalone code experiments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repo Card */}
        <Card className="border-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                <FolderGit2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-900">Connect Repository</h3>
                <p className="text-xs font-medium text-slate-400">Analyze full GitHub projects</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="h-11 bg-slate-50 border-none focus-visible:ring-blue-500 text-sm font-medium"
              />
              <Button
                onClick={handleConnect}
                disabled={!repoUrl || isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold shadow-md shadow-blue-100"
              >
                {isConnecting ? "Connecting..." : "Initialize Repo Audit"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Single File Card */}
        <Card className="border-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white overflow-hidden group">
          <CardContent className="p-8 flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-900">Single File Audit</h3>
                <p className="text-xs font-medium text-slate-400">Isolated analysis & containersation</p>
              </div>
            </div>

            <div className="mt-auto">
              <Button
                onClick={() => uploadSingleFile()}
                variant="outline"
                className="w-full h-24 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col gap-2 rounded-2xl"
              >
                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <Upload className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-slate-500">Pick Source File (Python, C#, Java...)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Project Ledger</h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{projects.length} ACTIVE</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {projects.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <FolderGit2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Workspace Empty</p>
            </div>
          ) : (
            projects.map((project) => (
              <Card
                key={project.id}
                onClick={() => setActiveProject(project.id)}
                className="border-none shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer group bg-white rounded-2xl"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                        {project.type === 'file' ? getLanguageIcon(project.fileExtension) : <FolderGit2 className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h4>
                          <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 ${
                            project.type === 'file' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {project.type === 'file' ? 'Stand-alone' : 'Repository'}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-1 truncate max-w-[300px]">{project.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10">
                       <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">VIOLATIONS</p>
                          <p className="text-lg font-black text-red-600 leading-none mt-1">
                            {project.metrics?.vulnerabilities ?? 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">COMPLEXITY</p>
                          <p className="text-lg font-black text-slate-900 leading-none mt-1">
                            {project.metrics?.avgComplexity?.toFixed(1) ?? "0.0"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3 h-3" />
                        <span>{project.lastScanned}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleDelete(e, project.id)}
                          className="w-9 h-9 text-slate-300 hover:bg-red-50 hover:text-red-600 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-300 hover:bg-slate-50 rounded-xl">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
