import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
  shadows,
} from "@/lib/design-tokens";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface Listing {
  id: number;
  name: string;
  description: string;
  host_id: number;
  host_name: string | null;
  host_email: string | null;
  category: string;
  price_cents: number;
  enabled: boolean;
  created_at: string;
}

export default function AdminListingList() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const limit = 20;
  const offset = currentPage * limit;

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!search.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const searchTrimmed = search.trim();
      const searchInt = Number.parseInt(searchTrimmed, 10);
      const isInteger = !isNaN(searchInt) && Number.isFinite(searchInt);

      let url = "/admin/listings?";
      if (isInteger) {
        url += `id=${searchInt}`;
      } else {
        url += `name=${encodeURIComponent(searchTrimmed)}`;
      }

      const response = await apiFetch(url);
      if (!response.ok) throw new Error("Failed to load listings");

      const data = await response.json();
      setListings(data.listings);
      setTotalListings(data.total);
      setCurrentPage(0);
    } catch (err: any) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (listingId: number, enabled: boolean) => {
    setUpdatingIds((prev) => new Set([...prev, listingId]));
    try {
      const response = await apiFetch(`/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update listing");

      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, enabled: !enabled } : l)),
      );
    } catch (err: any) {
      setError(err.message || "Failed to update listing");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    setDeletingId(listingId);
    try {
      const response = await apiFetch(`/admin/listings/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete listing");

      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setTotalListings((prev) => prev - 1);
    } catch (err: any) {
      setError(err.message || "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredListings = search.trim()
    ? listings.filter((listing) => {
        const searchLower = search.toLowerCase();
        const nameMatch = listing.name
          .toLowerCase()
          .includes(searchLower);
        const idMatch = listing.id.toString().includes(searchLower);
        return nameMatch || idMatch;
      })
    : [];

  const totalPages = Math.ceil(totalListings / limit);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className={combineTokens(spacing.gap.md, "flex flex-col")}>
      <Input
        type="text"
        placeholder="Search using a listing's title or its ID number."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(0);
        }}
        className="flex-1"
      />

      {error && (
        <div
          className={combineTokens(
            "bg-destructive/10 border border-destructive text-destructive",
            spacing.padding.md,
            "rounded-lg flex items-center gap-2",
          )}
        >
          <AlertCircle className={spacing.dimensions.icon.sm} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <Loader2 className="animate-spin" />
        </div>
      ) : !search.trim() ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">
            Search using a listing's title or its ID number.
          </p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No listings match your search.</p>
        </div>
      ) : (
        <>
          <div className={combineTokens(spacing.grid.responsive, "gap-6")}>
            {filteredListings.map((listing) => {
              const isUpdating = updatingIds.has(listing.id);
              const isDeleting = deletingId === listing.id;

              return (
                <Card key={listing.id} className={shadows.card}>
                  <div className={spacing.padding.card}>
                    <div
                      className={combineTokens(
                        layouts.flex.between,
                        spacing.margin.bottomMd,
                      )}
                    >
                      <div className="flex-1">
                        <h3 className={typography.combinations.subheading}>
                          {listing.name}
                        </h3>
                        <p
                          className={combineTokens(
                            typography.size.sm,
                            "text-muted-foreground",
                            spacing.margin.topSm,
                          )}
                        >
                          Category: {listing.category}
                        </p>
                      </div>
                      <div
                        className={combineTokens(
                          "bg-primary text-primary-foreground",
                          spacing.padding.buttonSm,
                          "rounded text-sm font-semibold",
                        )}
                      >
                        ${(listing.price_cents / 100).toFixed(2)}/day
                      </div>
                    </div>

                    <p
                      className={combineTokens(
                        typography.size.sm,
                        spacing.margin.bottomMd,
                      )}
                    >
                      {listing.description?.substring(0, 100)}...
                    </p>

                    <div
                      className={combineTokens(
                        spacing.gap.sm,
                        "flex flex-col",
                        spacing.margin.bottomMd,
                      )}
                    >
                      <div className="text-sm">
                        <span className="font-medium">Host:</span>{" "}
                        {listing.host_name} ({listing.host_email})
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Reservations:</span>{" "}
                        {listing.reservation_count}
                      </div>
                    </div>

                    <div
                      className={combineTokens(
                        layouts.flex.between,
                        spacing.gap.md,
                      )}
                    >
                      <div
                        className={combineTokens(
                          layouts.flex.start,
                          spacing.gap.md,
                          "items-center",
                        )}
                      >
                        <span className="text-sm font-medium">Enabled:</span>
                        <Switch
                          checked={listing.enabled}
                          disabled={isUpdating}
                          onCheckedChange={() =>
                            handleToggleEnabled(listing.id, listing.enabled)
                          }
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                          >
                            <Trash2
                              className={combineTokens(
                                spacing.dimensions.icon.sm,
                                "mr-2",
                              )}
                            />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{listing.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div
                            className={combineTokens(
                              layouts.flex.end,
                              spacing.gap.sm,
                            )}
                          >
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteListing(listing.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className={combineTokens(layouts.flex.between, "mt-6")}>
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages} ({totalListings} total
              listings)
            </div>
            <div className={combineTokens(layouts.flex.start, "gap-2")}>
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrevious}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className={spacing.dimensions.icon.sm} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
              >
                <ChevronRight className={spacing.dimensions.icon.sm} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
