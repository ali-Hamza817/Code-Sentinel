import React from 'react';
import { Minus, Square, X, ShieldCheck } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const handleMinimize = () => (window as any).api.minimize();
  const handleMaximize = () => (window as any).api.maximize();
  const handleClose = () => (window as any).api.close();

  return (
    <div
      className="flex h-10 select-none items-center justify-between border-b border-slate-200 bg-white px-4"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900">
          <ShieldCheck className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-800">
          CodeSentinel
        </span>
      </div>

      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          onClick={handleMinimize}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
