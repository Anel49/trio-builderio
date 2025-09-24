import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ViewAllButtonProps {
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ViewAllButton({ 
  onClick, 
  href = "/browse", 
  className = "" 
}: ViewAllButtonProps) {
  const handleClick = onClick || (() => (window.location.href = href));

  return (
    <Button
      variant="ghost"
      className={`group pt-4 pb-2 px-4 hover:bg-transparent ${className}`}
      onClick={handleClick}
    >
      View all
      <ChevronRight className="ml-2 mt-[3px] h-4 w-4 group-hover:translate-x-1 transition-transform" />
    </Button>
  );
}
