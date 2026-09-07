import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./ui/utils";

/* ------------------------------------------------------------------ *
 * Shared layout + surface primitives.
 * One page rhythm, one card, one stat tile, one empty state, one
 * terminal frame — so every screen reads as the same product.
 * ------------------------------------------------------------------ */

export function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto max-w-[1400px] p-8 space-y-6 animate-in fade-in duration-300",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions || meta ? (
        <div className="flex shrink-0 flex-col items-end gap-2">
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
          {meta ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {meta}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const iconTone = {
  default: "bg-slate-100 text-slate-500",
  info: "bg-blue-50 text-blue-600",
  critical: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
} as const;

export type Tone = keyof typeof iconTone;

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
          {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={cn("rounded-lg p-2", iconTone[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-700">
                {title}
              </p>
              {description ? (
                <p className="truncate text-xs text-slate-400">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ScreenEmpty({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <EmptyState icon={icon} title={title} description={description} />
    </div>
  );
}

const pillTone = {
  neutral: "bg-slate-100 text-slate-600",
  live: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-blue-50 text-blue-700",
} as const;

export function StatusPill({
  tone = "neutral",
  dot,
  children,
  className,
}: {
  tone?: keyof typeof pillTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const showDot = dot ?? tone === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        pillTone[tone],
        className,
      )}
    >
      {showDot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "live" ? "bg-emerald-500 animate-pulse" : "bg-current",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export function Console({
  title,
  live,
  actions,
  children,
  className,
  height = "h-80",
  bodyRef,
}: {
  title?: React.ReactNode;
  live?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: string;
  bodyRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              live ? "bg-emerald-400 animate-pulse" : "bg-slate-600",
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </span>
        </div>
        {actions}
      </div>
      <div
        ref={bodyRef}
        className={cn(
          "overflow-y-auto p-4 font-mono text-[11px] leading-relaxed",
          height,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* Severity helpers — one vocabulary for critical / high / medium / low. */

export const severityIconTone = (severity?: string): Tone => {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
    case "medium":
      return "warning";
    default:
      return "default";
  }
};

export const severityBadgeClass = (severity?: string): string => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-amber-100 text-amber-700";
    case "medium":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};
