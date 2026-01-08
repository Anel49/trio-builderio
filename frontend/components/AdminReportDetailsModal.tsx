import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface ReportDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
}

export function AdminReportDetailsModal({
  open,
  onOpenChange,
  report,
}: ReportDetailsModalProps) {
  if (!report) return null;

  const snapshot = report.reported_content_snapshot;
  if (!snapshot) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">No snapshot data available</p>
        </DialogContent>
      </Dialog>
    );
  }

  const isListing = report.report_for === "listing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isListing ? (
            <>
              {snapshot.title && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Title</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {snapshot.title}
                  </p>
                </div>
              )}

              {snapshot.description && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Description</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {snapshot.description}
                  </p>
                </div>
              )}

              {snapshot.latitude !== null && snapshot.latitude !== undefined && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Latitude</p>
                  <p className="text-sm text-muted-foreground">
                    {snapshot.latitude}
                  </p>
                </div>
              )}

              {snapshot.longitude !== null && snapshot.longitude !== undefined && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Longitude</p>
                  <p className="text-sm text-muted-foreground">
                    {snapshot.longitude}
                  </p>
                </div>
              )}

              {snapshot.addons && snapshot.addons.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Addons</p>
                  <div className="space-y-1">
                    {snapshot.addons.map(
                      (addon: any, idx: number) => (
                        <p
                          key={idx}
                          className="text-sm text-muted-foreground ml-2"
                        >
                          • {addon.item}
                          {addon.style && ` (${addon.style})`}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              )}

              {snapshot.bucket_urls && snapshot.bucket_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Images</p>
                  <div className="grid grid-cols-2 gap-3">
                    {snapshot.bucket_urls.map((url: string, idx: number) => (
                      <div key={idx} className="rounded border border-border overflow-hidden">
                        <img
                          src={url}
                          alt={`Listing image ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {snapshot.name && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {snapshot.name}
                  </p>
                </div>
              )}

              {snapshot.email && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Email</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {snapshot.email}
                  </p>
                </div>
              )}

              {snapshot.username && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Username</p>
                  <p className="text-sm text-muted-foreground">
                    @{snapshot.username}
                  </p>
                </div>
              )}

              {snapshot.bucket_url && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Avatar</p>
                  <div className="rounded border border-border overflow-hidden w-24 h-24">
                    <img
                      src={snapshot.bucket_url}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {!snapshot.bucket_url && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Avatar</p>
                  <p className="text-sm text-muted-foreground">None</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
