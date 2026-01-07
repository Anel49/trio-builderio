import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
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

interface ListingReview {
  id: number;
  listing_id: number;
  listing_title: string | null;
  reviewer_id: number;
  reviewer_name: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
}

interface UserReview {
  id: number;
  reviewed_user_id: number;
  reviewed_user_name: string | null;
  reviewer_id: number;
  reviewer_name: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
}

function formatDateForAdmin(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const tz = date
    .toLocaleTimeString("en-US", { timeZoneName: "short" })
    .split(" ")
    .pop();

  return `${month} ${day}, ${year}, ${time} ${tz}`;
}

export default function AdminReviewList() {
  const [listingReviews, setListingReviews] = useState<ListingReview[]>([]);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastSearchedTerm, setLastSearchedTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewType, setReviewType] = useState<"listing" | "user">("listing");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const limit = 6;
  const offset = currentPage * limit;

  const getSearchPlaceholder = () => {
    if (reviewType === "listing") {
      return "Search using a listing name...";
    }
    return "Search using a user's name or their username...";
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasSearched) {
      loadReviews();
    }
  }, [currentPage, reviewType]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    setCurrentPage(0);
    setLastSearchedTerm(search);
    setHasSearched(true);
    loadReviews();
  };

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        review_type: reviewType,
      });
      if (lastSearchedTerm) params.append("search", lastSearchedTerm);

      const url = `/admin/reviews?${params.toString()}`;
      console.log("[AdminReviewList] Fetching:", url);

      const response = await apiFetch(url);
      console.log("[AdminReviewList] Response status:", response.status);

      const responseText = await response.text();

      if (!response.ok) {
        console.error("[AdminReviewList] Error response received");
        throw new Error(
          `Failed to load reviews (${response.status}): ${responseText.substring(0, 200)}`,
        );
      }

      try {
        const data = JSON.parse(responseText);
        console.log("[AdminReviewList] Data received:", data);
        if (reviewType === "listing") {
          setListingReviews(data.reviews || []);
        } else {
          setUserReviews(data.reviews || []);
        }
        setTotalReviews(data.total || 0);
      } catch (parseErr) {
        console.error("[AdminReviewList] JSON parse error:", parseErr);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 200)}`,
        );
      }
    } catch (err: any) {
      console.error("[AdminReviewList] Error:", err);
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

      if (reviewType === "listing") {
        setListingReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
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

  const reviews = reviewType === "listing" ? listingReviews : userReviews;

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

      <div className="mb-0">
        <Tabs
          value={reviewType}
          onValueChange={(v) => {
            setReviewType(v as "listing" | "user");
            setCurrentPage(0);
            setSearch("");
            setLastSearchedTerm("");
            setHasSearched(false);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listing">Listing Reviews</TabsTrigger>
            <TabsTrigger value="user">User Reviews</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={combineTokens(layouts.flex.between, "gap-4")}>
        <Input
          type="text"
          placeholder={getSearchPlaceholder()}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
          onKeyDown={handleSearch}
          className="flex-1"
        />
      </div>

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
          <div className="overflow-x-auto themed-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {reviewType === "listing" ? (
                    <>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Listing Title
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Review
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Reviewer
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Created
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Updated
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Action
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Reviewed User
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Review
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Reviewer
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Created
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Updated
                      </th>
                      <th
                        className={combineTokens(
                          spacing.padding.md,
                          "text-left",
                        )}
                      >
                        Action
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b hover:bg-muted/50">
                    {reviewType === "listing" &&
                    review instanceof Object &&
                    "listing_title" in review ? (
                      <>
                        <td className={spacing.padding.md}>
                          <span className={typography.weight.medium}>
                            {(review as ListingReview).listing_title || "N/A"}
                          </span>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {(review as ListingReview).comment}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-sm">
                            {(review as ListingReview).reviewer_name ||
                              "Unknown"}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-xs text-muted-foreground">
                            {formatDateForAdmin(
                              (review as ListingReview).created_at,
                            )}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-xs text-muted-foreground">
                            {formatDateForAdmin(
                              (review as ListingReview).updated_at,
                            )}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === review.id}
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
                                <AlertDialogTitle>
                                  Delete Review
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this review?
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
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={spacing.padding.md}>
                          <span className={typography.weight.medium}>
                            {(review as UserReview).reviewed_user_name ||
                              "Unknown"}
                          </span>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {(review as UserReview).comment}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-sm">
                            {(review as UserReview).reviewer_name || "Unknown"}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-xs text-muted-foreground">
                            {formatDateForAdmin(
                              (review as UserReview).created_at,
                            )}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <p className="text-xs text-muted-foreground">
                            {formatDateForAdmin(
                              (review as UserReview).updated_at,
                            )}
                          </p>
                        </td>
                        <td className={spacing.padding.md}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === review.id}
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
                                <AlertDialogTitle>
                                  Delete Review
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this review?
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
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
