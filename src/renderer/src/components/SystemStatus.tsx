import { useState, useEffect } from "react";
import { Container, BrainCircuit, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";

export function SystemStatus() {
  const [dockerStatus, setDockerStatus] = useState<'running' | 'not_running' | 'loading'>('loading');
  const [ollamaStatus, setOllamaStatus] = useState<'running' | 'not_running' | 'loading'>('loading');
  const [ollamaChecked, setOllamaChecked] = useState(false);

  const checkHealth = async () => {
    // 1. Check Docker
    try {
      const docker = await (window as any).api.checkDocker();
      setDockerStatus(docker === 'running' ? 'running' : 'not_running');
    } catch {
      setDockerStatus('not_running');
    }

    // 2. Check Ollama — use ensureAIDocker (HEAD /) NOT pullModel — never call pull as a health check!
    if (!ollamaChecked) {
      try {
        const result = await (window as any).api.ensureAIDocker();
        setOllamaStatus(result === 'running' ? 'running' : 'not_running');
        if (result === 'running') setOllamaChecked(true); // stop re-checking once confirmed
      } catch {
        setOllamaStatus('not_running');
      }
    }
  };

  useEffect(() => {
    checkHealth();
    // Only poll Docker every 30s — Ollama status is cached once found
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [ollamaChecked]);

  const StatusDot = ({ status }: { status: 'running' | 'not_running' | 'loading' }) => {
    if (status === 'running') return <CheckCircle2 className="w-2.5 h-2.5" />;
    if (status === 'loading') return <Loader2 className="w-2.5 h-2.5 animate-spin" />;
    return <XCircle className="w-2.5 h-2.5" />;
  };

  const pillClass = (status: 'running' | 'not_running' | 'loading') =>
    `flex items-center gap-1.5 rounded-md border-none px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
      status === 'running'
        ? 'bg-emerald-50 text-emerald-700'
        : status === 'loading'
          ? 'bg-slate-100 text-slate-400'
          : 'bg-red-50 text-red-700'
    }`;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={pillClass(dockerStatus)}>
        <Container className="h-3 w-3" />
        <span>Docker</span>
        <StatusDot status={dockerStatus} />
      </Badge>

      <Badge variant="outline" className={pillClass(ollamaStatus)}>
        <BrainCircuit className="h-3 w-3" />
        <span>Llama 3.2</span>
        <StatusDot status={ollamaStatus} />
      </Badge>
    </div>
  );
}
