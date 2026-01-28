import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { apiFetch } from "@/lib/api";

interface AdminActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
  reportFor: "listing" | "user";
  onActionComplete: () => void;
  onCancel: () => void;
}

const LISTING_FIELD_OPTIONS = [
  { id: "title", label: "Title" },
  { id: "location", label: "Location" },
  { id: "description", label: "Description" },
  { id: "addons", label: "Addons" },
  { id: "images", label: "Images" },
];

const USER_FIELD_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "username", label: "Username" },
];

export function AdminActionsModal({
  open,
  onOpenChange,
  report,
  reportFor,
  onActionComplete,
  onCancel,
}: AdminActionsModalProps) {
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set());
  const [moderatorMessage, setModeratorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isListingReport = reportFor === "listing";
  const fieldOptions = isListingReport
    ? LISTING_FIELD_OPTIONS
    : USER_FIELD_OPTIONS;
  const messageLabel = isListingReport
    ? "Message to listing's host"
    : "Message to user";
  const messageErrorText = isListingReport
    ? "Message to listing's host is required"
    : "Message to user is required";

  const toggleField = (fieldId: string) => {
    const newChecked = new Set(checkedFields);
    if (newChecked.has(fieldId)) {
      newChecked.delete(fieldId);
    } else {
      newChecked.add(fieldId);
    }
    setCheckedFields(newChecked);
  };

  const handleConfirmAction = async () => {
    if (!moderatorMessage.trim()) {
      setError(messageErrorText);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fieldsToRemove = Array.from(checkedFields);
      const response = await apiFetch(
        `/admin/reports/${report.id}/take-action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldsToRemove,
            moderatorMessage: moderatorMessage.trim(),
            reportFor,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setError(data.error || "Failed to take action on report");
        return;
      }

      onActionComplete();
    } catch (err: any) {
      setError(err.message || "Failed to take action on report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCheckedFields(new Set());
    setModeratorMessage("");
    setError(null);
    onOpenChange(false);
    onCancel();
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    }
  };

  const isConfirmDisabled =
    !moderatorMessage.trim() || isLoading || checkedFields.size === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Actions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Remove Section */}
          <div className="space-y-3">
            <p className="font-semibold text-sm">Remove:</p>
            <div className="space-y-2 ml-2">
              {fieldOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={checkedFields.has(option.id)}
                    onCheckedChange={() => toggleField(option.id)}
                  />
                  <label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-semibold">
              {messageLabel}
            </label>
            <textarea
              id="message"
              placeholder="Enter moderator notes..."
              value={moderatorMessage}
              onChange={(e) => setModeratorMessage(e.target.value)}
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            disabled={isConfirmDisabled}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Processing..." : "Confirm Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
