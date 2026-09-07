import { Outlet, Link, useLocation } from "react-router";
import { TitleBar } from "./TitleBar";
import {
  LayoutDashboard,
  FolderGit2,
  FileSearch,
  Activity,
  Shield,
  BarChart3,
  Sparkles,
  Hammer,
  Container,
  FileText,
  Settings,
  Search,
  User,
  Lock,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useProjectStore } from "../store/projectStore";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { SystemStatus } from "./SystemStatus";

const navigationItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/repository", icon: FolderGit2, label: "Repository" },
  { path: "/static-analysis", icon: FileSearch, label: "Static Analysis" },
  { path: "/dynamic-analysis", icon: Activity, label: "Dynamic Analysis" },
  { path: "/vulnerabilities", icon: Shield, label: "Vulnerabilities" },
  { path: "/complexity", icon: BarChart3, label: "Complexity" },
  { path: "/ai-review", icon: Sparkles, label: "AI Review" },
  { path: "/build-ci", icon: Hammer, label: "Build & CI" },
  { path: "/container-insights", icon: Container, label: "Container Insights" },
  { path: "/reports", icon: FileText, label: "Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function MainLayout() {
  const location = useLocation();
  const { projects, activeProjectId, setActiveProject } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50">
      <TitleBar />
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 pr-6 border-r border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">CodeSentinel</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Project</span>
            <Select value={activeProjectId || ""} onValueChange={setActiveProject}>
              <SelectTrigger className="w-[200px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-slate-400" />
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={`Search in ${activeProject?.name || 'project'}...`}
              className="pl-10 h-9 bg-slate-50 border-slate-200 focus-visible:ring-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SystemStatus />
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <Badge variant="outline" className="hidden gap-1.5 rounded-md border-transparent bg-slate-100 text-slate-600 lg:flex">
            <Lock className="w-3 h-3" />
            Lumina v4.0
          </Badge>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <User className="w-5 h-5 text-slate-600" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
