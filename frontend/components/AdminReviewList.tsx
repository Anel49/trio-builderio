import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Star,
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
import { format } from "date-fns";

interface Review {
  id: number;
  listing_id: number;
  listing_title: string;
  renter_id: number;
  renter_name: string | null;
  renter_email: string | null;
  host_name: string | null;
  host_email: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export default function AdminReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const limit = 20;
  const offset = currentPage * limit;

  useEffect(() => {
    loadReviews();
  }, [currentPage]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(
        `/admin/reviews?limit=${limit}&offset=${offset}`,
      );
      if (!response.ok) throw new Error("Failed to load reviews");

      const data = await response.json();
      setReviews(data.reviews);
      setTotalReviews(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    setDeletingId(reviewId);
    try {
      const response = await apiFetch(`/admin/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete review");

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalReviews((prev) => prev - 1);
    } catch (err: any) {
      setError(err.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(totalReviews / limit);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const renderStars = (rating: number) => {
    return (
      <div className={combineTokens(layouts.flex.start, "gap-1")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className={combineTokens(spacing.gap.md, "flex flex-col")}>
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
      ) : reviews.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No reviews found</p>
        </div>
      ) : (
        <>
          <div className={combineTokens(spacing.grid.responsive, "gap-6")}>
            {reviews.map((review) => {
              const isDeleting = deletingId === review.id;
              const createdDate = new Date(review.created_at);

              return (
                <Card key={review.id} className={shadows.card}>
                  <div className={spacing.padding.card}>
                    <div
                      className={combineTokens(
                        layouts.flex.between,
                        spacing.margin.bottomMd,
                      )}
                    >
                      <div className="flex-1">
                        <h3 className={typography.combinations.subheading}>
                          {review.listing_title}
                        </h3>
                        <p
                          className={combineTokens(
                            typography.size.sm,
                            "text-muted-foreground",
                            spacing.margin.topSm,
                          )}
                        >
                          Reviewed by {review.renter_name}
                        </p>
                      </div>
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(createdDate, "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div
                      className={combineTokens(
                        "bg-muted",
                        spacing.padding.md,
                        "rounded",
                        spacing.margin.bottomMd,
                      )}
                    >
                      <p
                        className={combineTokens(typography.size.sm, "italic")}
                      >
                        "{review.comment}"
                      </p>
                    </div>

                    <div
                      className={combineTokens(
                        spacing.gap.sm,
                        "flex flex-col text-sm",
                        spacing.margin.bottomMd,
                      )}
                    >
                      <div>
                        <span className="font-medium">Renter:</span>{" "}
                        {review.renter_name} ({review.renter_email})
                      </div>
                      <div>
                        <span className="font-medium">Host:</span>{" "}
                        {review.host_name} ({review.host_email})
                      </div>
                      <div>
                        <span className="font-medium">Listing ID:</span>{" "}
                        {review.listing_id}
                      </div>
                    </div>

                    <div className={combineTokens(layouts.flex.end)}>
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
                            Delete Review
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this review? This
                              action cannot be undone.
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
                              onClick={() => handleDeleteReview(review.id)}
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
              Page {currentPage + 1} of {totalPages} ({totalReviews} total
              reviews)
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
