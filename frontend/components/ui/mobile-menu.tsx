import React from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Package, Search, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ isOpen, onOpenChange }: MobileMenuProps) {
  const { authenticated } = useAuth();
  const handleNavigation = (href: string) => {
    onOpenChange(false);
    window.location.href = href;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col space-y-4 mt-8">
          <Button
            variant="ghost"
            className="justify-start h-12 text-base"
            onClick={() => handleNavigation("/browse")}
          >
            <Search className="h-5 w-5 mr-3" />
            Browse listings
          </Button>

          <Button
            variant="ghost"
            className="justify-start h-12 text-base"
            onClick={() => handleNavigation("/upload")}
          >
            <Package className="h-5 w-5 mr-3" />
            Rent your product
          </Button>

          <Button
            variant="ghost"
            className="justify-start h-12 text-base sm:hidden"
            onClick={() => handleNavigation("/order-history")}
          >
            <ClipboardList className="h-5 w-5 mr-3" />
            Orders and Requests
          </Button>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Appearance
            </span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
