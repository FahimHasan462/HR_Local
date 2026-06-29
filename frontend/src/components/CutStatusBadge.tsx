import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "dir check": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  combined: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

type CutStatusBadgeProps = {
  status: string;
  onClick?: () => void;
  active?: boolean;
};

export const CutStatusBadge = ({ status, onClick, active }: CutStatusBadgeProps) => {
  const key = status.trim().toLowerCase();
  const style = statusStyles[key] ?? "bg-muted text-muted-foreground border-border";
  const className = cn(
    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
    style,
    onClick && "cursor-pointer transition-opacity hover:opacity-80",
    active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {status || "—"}
      </button>
    );
  }

  return <span className={className}>{status || "—"}</span>;
};
