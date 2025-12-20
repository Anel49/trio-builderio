import React from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  isSubmitting?: boolean;
  onSubmit: () => void;
  isEditing?: boolean;
  onDelete?: () => void;
  placeholder?: string;
}

export function ReviewModal({
  open,
  onOpenChange,
  title = "Post a Review",
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  isSubmitting = false,
  onSubmit,
  isEditing = false,
  onDelete,
  placeholder = "Share your experience with this listing...",
}: ReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Review" : title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => onRatingChange(r)}
                  className="p-1 hover:scale-110 transition-transform"
                  aria-label={`Rate ${r} stars`}
                  type="button"
                >
                  <Star
                    size={28}
                    className={
                      r <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="review-comment" className="text-sm font-medium">
              Your Review
            </label>
            <textarea
              id="review-comment"
              placeholder={placeholder}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="w-full min-h-28 p-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-between pt-4">
            <div className="flex gap-2">
              {isEditing && onDelete && (
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  Delete Review
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || !comment.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
