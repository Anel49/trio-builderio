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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Addons</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {addons.map((addon) => {
            const isSelected = selectedAddons.has(addon.id);
            const qty = quantities.get(addon.id) || "";

            return (
              <div
                key={addon.id}
                className="flex items-start gap-3 pb-3 border-b last:border-b-0"
              >
                <Checkbox
                  id={`addon-${addon.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleAddonToggle(addon, checked as boolean)
                  }
                  className="mt-1 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`addon-${addon.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {addon.item}
                    {addon.style && (
                      <span className="text-muted-foreground ml-2">
                        ({addon.style})
                      </span>
                    )}
                  </label>

                  {addon.price !== null && (
                    <div className="text-xs text-muted-foreground mt-1">
                      $
                      {addon.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {!addon.consumable && " per item"}
                    </div>
                  )}

                  {addon.consumable && isSelected && (
                    <div className="mt-2 flex items-center gap-2">
                      <label
                        htmlFor={`qty-${addon.id}`}
                        className="text-xs font-medium"
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
                        className="w-20 h-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
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
