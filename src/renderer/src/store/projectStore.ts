import { create } from 'zustand';
import { DEMO_MODE, VELLUM_DEMO, VELLUM_ID } from '../lib/demo';

export interface ScanFinding {
  id: string;
  type: 'security' | 'quality' | 'complexity';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  file: string;
  line: number;
  cwe?: string;
  affectedCode?: string;
  suggestedFix?: string;
}

export interface ProjectMetrics {
  totalFiles: number;
  vulnerabilities: number;
  avgComplexity: number;
  buildStatus: 'Passed' | 'Failed' | 'Running' | 'Pending';
  buildTimeMs?: number;
  startupTimeMs?: number;
  totalBranches?: number;
  highRiskFunctions?: { name: string; score: number; file: string; line: number }[];
  dockerStats?: {
    cpu: string;
    mem: string;
    memUsage: string;
  };
}

export interface Project {
  id: string;
  name: string;
  url: string;
  path: string;
  lastScanned: string;
  status: 'idle' | 'cloning' | 'scanning' | 'running' | 'completed' | 'failed';
  metrics: ProjectMetrics;
  findings: ScanFinding[];
  aiReviews: Record<string, { 
    findings: ScanFinding[]; 
    measures: string[]; 
    reasoning?: string;
    messages?: { role: 'user' | 'assistant'; content: string }[] 
  }>;
  buildLogs?: string[];
  sandboxStatus?: 'stopped' | 'building' | 'running';
  type: 'repo' | 'file';
  fileExtension?: string;
  /** Presentation-only sample project — never persisted. */
  demo?: boolean;
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null,
  scanProgress: number;
  scanningFile: string | null;
  scanStartTime: number | null;
  estimatedRemainingSeconds: number | null;
  loadProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'status' | 'metrics' | 'findings' | 'type'>) => Promise<void>;
  uploadSingleFile: () => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  getActiveProject: () => Project | null;
  reScanProject: (id: string) => Promise<void>;
  setActiveProject: (id: string) => void;
  removeProject: (id: string) => Promise<void>;
  startDynamicRun: (id: string) => Promise<void>;
  saveAIReview: (projectId: string, fileName: string, findings: any[], measures: string[]) => Promise<void>;
}

// Shared findings mapper — handles both StaticFinding and AIReviewResult shapes
function mapFindings(findings: any[]): ScanFinding[] {
  return (findings || []).map((f: any) => ({
    id: Math.random().toString(36).substring(7),
    type: f.type?.startsWith('AI:') ? 'security' as const : 'quality' as const,
    severity: (f.severity || 'low').toLowerCase() as ScanFinding['severity'],
    title: f.title || f.issue || f.message || f.type || 'Logic Finding',
    description: f.description || f.recommendation || '',
    file: f.file || '',
    line: f.line || 0,
    affectedCode: f.snippet || f.affectedCode || '',
    suggestedFix: f.suggestedFix || f.recommendation || ''
  }));
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  activeProjectId: null,
  scanProgress: 0,
  scanningFile: null,
  scanStartTime: null,
  estimatedRemainingSeconds: null,

  loadProjects: async () => {
    try {
      const stored = await (window as any).api.getProjects();
      const real = (stored || []).filter((p: Project) => p.id !== VELLUM_ID);
      const list = DEMO_MODE
        ? [VELLUM_DEMO as unknown as Project, ...real]
        : real;
      if (list.length > 0) {
        set({
          projects: list,
          activeProjectId: DEMO_MODE ? VELLUM_ID : list[0].id,
        });
      }
    } catch (err) {
      console.error('[Store] Failed to load projects:', err);
      if (DEMO_MODE) {
        set({
          projects: [VELLUM_DEMO as unknown as Project],
          activeProjectId: VELLUM_ID,
        });
      }
    }
  },

  addProject: async (newProject) => {
    const id = Math.random().toString(36).substring(7);
    const project: Project = {
        ...newProject,
        id,
        status: 'idle',
        sandboxStatus: 'stopped',
        type: 'repo',
        fileExtension: '',
        lastScanned: 'Never',
        metrics: { totalFiles: 0, vulnerabilities: 0, avgComplexity: 0, buildStatus: 'Pending' },
        findings: [],
        aiReviews: {}
    };

    // Add to UI immediately
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: id
    }));
    await (window as any).api.saveProject(project);

    // STEP 1: Clone
    try {
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, status: 'cloning' } : p)
      }));

      const cloneData = await (window as any).api.cloneRepo(project.url);
      const clonedPath = cloneData.localPath;

      // STEP 2: Move to scanning state with actual path
      set((state) => ({
        projects: state.projects.map(p => p.id === id
          ? { ...p, status: 'scanning', path: clonedPath }
          : p
        ),
        scanStartTime: Date.now(),
        scanProgress: 1
      }));

      // STEP 3: Analyze
      const { metrics, findings } = await (window as any).api.analyzeProject(clonedPath);
      const storeFindings = mapFindings(findings);

      const finalProject: Project = {
        ...project,
        path: clonedPath,
        status: 'completed',
        lastScanned: new Date().toLocaleString(),
        metrics: {
          ...metrics,
          vulnerabilities: storeFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length,
          buildStatus: 'Passed'
        },
        findings: storeFindings
      };

      await (window as any).api.saveProject(finalProject);
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? finalProject : p),
        scanProgress: 100,
        scanningFile: null,
        estimatedRemainingSeconds: null,
        scanStartTime: null
      }));

    } catch (err) {
      console.error('[Store] Clone/Analyze failed:', err);
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, status: 'failed' } : p),
        scanStartTime: null,
        estimatedRemainingSeconds: null
      }));
    }
  },

  uploadSingleFile: async () => {
    try {
      const result = await (window as any).api.openFileDialog();
      if (!result) return;

      const { fileName, filePath, metrics, findings } = result;
      const id = Math.random().toString(36).substring(7);
      const storeFindings = mapFindings(findings);

      const project: Project = {
        id,
        name: fileName,
        url: 'Local File Audit',
        path: filePath,
        lastScanned: new Date().toLocaleString(),
        status: 'completed',
        sandboxStatus: 'stopped',
        type: 'file',
        fileExtension: fileName.split('.').pop() || '',
        findings: storeFindings,
        aiReviews: {},
        metrics: {
          ...metrics,
          totalFiles: 1,
          vulnerabilities: storeFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length,
          buildStatus: 'Passed'
        }
      };

      set((state) => ({
        projects: [...state.projects, project],
        activeProjectId: id
      }));

      await (window as any).api.saveProject(project);

    } catch (err) {
      console.error('[Store] Single file upload failed:', err);
    }
  },

  reScanProject: async (id: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    if (!project || !project.path) {
      console.error('[Store] Cannot re-scan: project has no local path');
      return;
    }

    try {
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, status: 'scanning' } : p),
        scanStartTime: Date.now(),
        scanProgress: 1
      }));

      const { metrics, findings } = await (window as any).api.analyzeProject(project.path);
      const storeFindings = mapFindings(findings);

      const updatedProject: Project = {
        ...project,
        status: 'completed',
        lastScanned: new Date().toLocaleString(),
        metrics: {
          ...metrics,
          vulnerabilities: storeFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length,
          buildStatus: 'Passed'
        },
        findings: storeFindings
      };

      set((state) => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        scanProgress: 100,
        scanningFile: null,
        estimatedRemainingSeconds: null,
        scanStartTime: null
      }));
      await (window as any).api.saveProject(updatedProject);
    } catch (err) {
      console.error('[Store] Re-scan failed:', err);
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, status: 'failed' } : p),
        scanStartTime: null,
        estimatedRemainingSeconds: null
      }));
    }
  },

  startDynamicRun: async (id: string) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    if (!project) return;

    try {
      // STEP 1: Build image
      let buildTimeMs = 0;
      let runResultRaw = '';

      if (project.type === 'file') {
        const result = await (window as any).api.dockerBuildSingleFile(id, project.path);
        buildTimeMs = result.runTime;
        runResultRaw = JSON.stringify(result);
      } else {
        buildTimeMs = await (window as any).api.dockerBuild(id, project.path);
        runResultRaw = await (window as any).api.dockerRun(id);
      }

      let startupTimeMs = 0;
      try {
        const parsed = JSON.parse(runResultRaw);
        startupTimeMs = parsed.runTime || 0;
      } catch { /* ... */ }

      const updated: Project = {
        ...project,
        sandboxStatus: 'running',
        metrics: {
          ...project.metrics,
          buildTimeMs: typeof buildTimeMs === 'number' ? buildTimeMs : 0,
          startupTimeMs
        }
      };

      set((state) => ({
        projects: state.projects.map(p => p.id === id ? updated : p)
      }));
      await (window as any).api.saveProject(updated);
    } catch (err) {
      console.error('[Store] Dynamic run failed:', err);
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, sandboxStatus: 'stopped' } : p)
      }));
    }
  },
  
  saveAIReview: async (projectId: string, fileName: string, aiFindings: any[], measures: string[], reasoning?: string, messages?: { role: 'user' | 'assistant'; content: string }[]) => {
    const findings = mapFindings(aiFindings);
    const state = get();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedReviews = {
      ...(project.aiReviews || {}),
      [fileName]: { findings, measures, reasoning, messages }
    };

    const updatedProject: Project = { 
      ...project, 
      aiReviews: updatedReviews 
    };

    set((state) => ({
      projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
    }));
    await (window as any).api.saveProject(updatedProject);
  },

  removeProject: async (id) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    if (!project) return;
    try {
      await (window as any).api.deleteProject(id, project.path);
      const remaining = state.projects.filter(p => p.id !== id);
      set({
        projects: remaining,
        activeProjectId: state.activeProjectId === id
          ? (remaining[0]?.id || null)
          : state.activeProjectId
      });
    } catch (err) {
      console.error('[Store] Delete failed:', err);
    }
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  updateProject: async (id, updates) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    if (!project) return;
    const updated = { ...project, ...updates };
    set((state) => ({
      projects: state.projects.map(p => p.id === id ? updated : p)
    }));
    if (project.demo) return; // never persist the sample project
    await (window as any).api.saveProject(updated);
  },

  getActiveProject: () => {
    const state = get();
    return state.projects.find(p => p.id === state.activeProjectId) || null;
  }
}));

// Real-time ETA calculation from IPC progress events
if (typeof window !== 'undefined' && (window as any).api?.onAnalysisProgress) {
  (window as any).api.onAnalysisProgress((p: { progress: number; file: string }) => {
    const { scanStartTime } = useProjectStore.getState();
    let eta: number | null = null;

    // Only start showing ETA after 5% to ensure stable estimate
    if (scanStartTime && p.progress > 5) {
      const elapsed = (Date.now() - scanStartTime) / 1000;
      const totalEstimated = elapsed / (p.progress / 100);
      eta = Math.max(0, Math.floor(totalEstimated - elapsed));
    }

    useProjectStore.setState({
      scanProgress: p.progress,
      scanningFile: p.file,
      estimatedRemainingSeconds: eta
    });
  });
}
