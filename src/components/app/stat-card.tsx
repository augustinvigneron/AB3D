import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  href?: string;
};

const tones = {
  neutral: "text-fg-muted bg-surface-2",
  brand: "text-brand bg-brand-soft",
  success: "text-success bg-success-soft",
  warning: "text-warning bg-warning-soft",
  danger: "text-danger bg-danger-soft",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "neutral", href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </>
  );
  const className = "card block p-4 transition-colors animate-rise";
  return href ? (
    <Link href={href} className={cn(className, "hover:border-border-strong")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
