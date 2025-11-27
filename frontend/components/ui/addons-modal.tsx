import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface Addon {
  id: number;
  item: string;
  style: string | null;
  price: number | null;
  consumable: boolean;
}

export interface SelectedAddon {
  id: number;
  item: string;
  style: string | null;
  price: number | null;
  consumable: boolean;
  qty?: number;
}

interface AddonsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  addons: Addon[];
  onConfirm: (selectedAddons: SelectedAddon[]) => void;
  onSkip: () => void;
}

export function AddonsModal({
  isOpen,
  onOpenChange,
  addons,
  onConfirm,
  onSkip,
}: AddonsModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<
    Map<number, SelectedAddon>
  >(new Map());
  const [quantities, setQuantities] = useState<Map<number, string>>(new Map());

  const handleAddonToggle = (addon: Addon, checked: boolean) => {
    const newSelected = new Map(selectedAddons);

    if (checked) {
      newSelected.set(addon.id, {
        ...addon,
        qty: addon.consumable ? 1 : undefined,
      });
    } else {
      newSelected.delete(addon.id);
      setQuantities((prev) => {
        const updated = new Map(prev);
        updated.delete(addon.id);
        return updated;
      });
    }

    setSelectedAddons(newSelected);
  };

  const handleQuantityChange = (addonId: number, value: string) => {
    setQuantities((prev) => {
      const updated = new Map(prev);
      updated.set(addonId, value);
      return updated;
    });
  };

  const validateSelection = (): boolean => {
    for (const [addonId, addon] of selectedAddons) {
      if (addon.consumable) {
        const qty = quantities.get(addonId) || "";
        const qtyNum = Number(qty);
        if (qty === "" || isNaN(qtyNum) || qtyNum <= 0) {
          return false;
        }
      }
    }
    return selectedAddons.size > 0;
  };

  const handleConfirm = () => {
    const confirmed = Array.from(selectedAddons.values()).map((addon) => ({
      ...addon,
      qty: addon.consumable ? Number(quantities.get(addon.id) || 1) : undefined,
    }));
    onConfirm(confirmed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Optional Addons</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pt-1">
          {addons.map((addon) => {
            const isSelected = selectedAddons.has(addon.id);
            const qty = quantities.get(addon.id) || "";

            return (
              <div key={addon.id}>
                {/* Desktop Layout - Item name and price in top row, qty below if needed */}
                <div className="hidden md:flex flex-col gap-2">
                  <div className="flex gap-3 items-center">
                    <div className="flex-shrink-0">
                      <Checkbox
                        id={`addon-${addon.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleAddonToggle(addon, checked as boolean)
                        }
                        className="mt-1"
                      />
                    </div>

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleAddonToggle(addon, !isSelected)}
                    >
                      <div className="text-sm font-medium no-underline">
                        {addon.item}
                        {addon.style && (
                          <span className="text-muted-foreground ml-2">
                            ({addon.style})
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="w-32 cursor-pointer"
                      onClick={() => handleAddonToggle(addon, !isSelected)}
                    >
                      <div className="text-sm">
                        {addon.price !== null ? (
                          <>
                            $
                            {addon.price.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {addon.consumable && (
                              <span className="text-xs text-muted-foreground ml-2">
                                per item
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Free</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {addon.consumable && isSelected && (
                    <div className="ml-8 w-32">
                      <label
                        htmlFor={`qty-${addon.id}`}
                        className="block text-xs font-medium text-muted-foreground mb-1"
                      >
                        Qty <span className="text-red-600">*</span>
                      </label>
                      <Input
                        id={`qty-${addon.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(addon.id, e.target.value)
                        }
                        placeholder="0"
                        className="w-full h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}
                </div>

                {/* Mobile Layout - Item name and price in top row, qty below if needed */}
                <div className="md:hidden flex flex-col gap-2">
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
                      <Checkbox
                        id={`addon-mobile-${addon.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleAddonToggle(addon, checked as boolean)
                        }
                        className="mt-1"
                      />
                    </div>

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleAddonToggle(addon, !isSelected)}
                    >
                      <div className="text-sm font-medium no-underline">
                        {addon.item}
                        {addon.style && (
                          <span className="text-muted-foreground ml-2">
                            ({addon.style})
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="w-32 cursor-pointer"
                      onClick={() => handleAddonToggle(addon, !isSelected)}
                    >
                      <div className="text-sm">
                        {addon.price !== null ? (
                          <>
                            $
                            {addon.price.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {addon.consumable && (
                              <span className="text-xs text-muted-foreground ml-2">
                                per item
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Free</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {addon.consumable && isSelected && (
                    <div className="ml-8 w-32">
                      <label
                        htmlFor={`qty-mobile-${addon.id}`}
                        className="block text-xs font-medium text-muted-foreground mb-1"
                      >
                        Qty <span className="text-red-600">*</span>
                      </label>
                      <Input
                        id={`qty-mobile-${addon.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(addon.id, e.target.value)
                        }
                        placeholder="0"
                        className="w-full h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleConfirm}
            disabled={!validateSelection()}
            className="flex-1"
          >
            Confirm addons
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
