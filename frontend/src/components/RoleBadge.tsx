import { Role, roleMeta } from "@/data/employees";
import { cn } from "@/lib/utils";

const styles: Record<Role, string> = {
  artist: "bg-gradient-primary text-primary-foreground",
  management: "bg-gradient-secondary text-secondary-foreground",
  hr: "bg-gradient-accent text-accent-foreground",
  IT: "bg-gradient-info text-info-foreground",
};

export const RoleBadge = ({ role, className }: { role: Role; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-soft",
      styles[role],
      className
    )}
  >
    <span>{roleMeta[role].emoji}</span>
    {roleMeta[role].label}
  </span>
);
