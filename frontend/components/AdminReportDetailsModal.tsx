import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ReportDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: number;
  reportFor: string;
}

export function AdminReportDetailsModal({
  open,
  onOpenChange,
  reportId,
  reportFor,
}: ReportDetailsModalProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchReportDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/admin/reports/${reportId}/details`);
        const data = await response.json();
        if (data.ok && data.report) {
          setReport(data.report);
        } else {
          setError(data.error || "Failed to load report details");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load report details");
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [open, reportId]);

  const snapshot = report?.reported_content_snapshot;
  const isListing = reportFor === "listing";

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl themed-scrollbar">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl themed-scrollbar">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          <p className="text-destructive">{error}</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report || !snapshot) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl themed-scrollbar">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">No snapshot data available</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto themed-scrollbar">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {isListing ? (
            <>
              <div className="grid grid-cols-2 gap-6">
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
                  <div className="space-y-2 col-span-2">
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
              </div>

              {snapshot.bucket_urls && snapshot.bucket_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Images</p>
                  <div className="grid grid-cols-2 gap-3">
                    {snapshot.bucket_urls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-border overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <img
                          src={url}
                          alt={`Listing image ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
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
              </div>

              {(snapshot.bucket_url || !snapshot.bucket_url) && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Avatar</p>
                  {snapshot.bucket_url ? (
                    <div className="rounded border border-border overflow-hidden w-24 h-24">
                      <img
                        src={snapshot.bucket_url}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">None</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
