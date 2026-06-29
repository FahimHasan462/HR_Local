import { Link } from "react-router-dom";
import { asRole, roleMeta, type Role } from "@/types/employee";
import { cn } from "@/lib/utils";

const styles: Record<Role, string> = {
  artist: "bg-gradient-primary text-primary-foreground",
  management: "bg-gradient-secondary text-secondary-foreground",
  hr: "bg-gradient-accent text-accent-foreground",
  IT: "bg-gradient-info text-info-foreground",
};

export const RoleBadge = ({
  role,
  className,
  profileHref,
}: {
  role?: Role | string;
  className?: string;
  profileHref?: string;
}) => {
  const r = asRole(role);
  const label = roleMeta[r].label;
  const showProfileLink = profileHref && r !== "hr";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-soft",
        styles[r],
        className
      )}
    >
      <span>{roleMeta[r].emoji}</span>
      {showProfileLink ? (
        <Link to={profileHref} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
          {label}
        </Link>
      ) : (
        label
      )}
    </span>
  );
};
