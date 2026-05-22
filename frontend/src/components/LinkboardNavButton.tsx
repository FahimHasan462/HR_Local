import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

export const LinkboardNavButton = () => (
  <Button variant="outline" size="default" className="gap-2" asChild>
    <Link to="/linkboard">
      <LayoutGrid className="h-4 w-4" />
      Linkboard
    </Link>
  </Button>
);
