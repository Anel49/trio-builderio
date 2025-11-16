import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MultiSelectCategoriesProps {
  categories: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectCategories({
  categories,
  selected,
  onSelectionChange,
  placeholder = "Search categories...",
}: MultiSelectCategoriesProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filteredCategories = categories.filter(
    (category) =>
      !selected.includes(category) &&
      category.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const handleSelectCategory = (category: string) => {
    onSelectionChange([...selected, category]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleRemoveCategory = (category: string) => {
    onSelectionChange(selected.filter((c) => c !== category));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to keep focus on input
    if ((e.target as HTMLElement).tagName !== "BUTTON") {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click on dropdown items
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setInputValue(""); // Clear loose text on blur
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue("");
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={handleBlur}
    >
      <div className="border border-input rounded-md bg-background p-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((category) => (
            <Badge key={category} variant="default" className="gap-1">
              {category}
              <button
                onClick={() => handleRemoveCategory(category)}
                className="ml-1 hover:opacity-70 focus:outline-none"
                aria-label={`Remove ${category}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="border-0 p-0 focus-visible:ring-0 h-auto text-sm"
        />
      </div>

      {isOpen && filteredCategories.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
          <ScrollArea className="h-48">
            <div className="p-1">
              {filteredCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleSelectCategory(category)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors cursor-pointer",
                    "focus:outline-none focus:bg-accent",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
