import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackCategories = [
  {
    id: "search-discovery",
    label: "Search & Discovery",
    description:
      "Suggestions for improving search, filters, categories, recommendations, or browsing listings.",
  },
  {
    id: "listing-pages",
    label: "Listing Pages",
    description:
      "Feedback on how individual listings look, what information they show, or how easy they are to understand.",
  },
  {
    id: "creating-managing",
    label: "Creating & Managing Listings",
    description:
      "Suggestions related to adding, editing, or managing items you list for rent.",
  },
  {
    id: "messaging-communication",
    label: "Messaging & Communication",
    description:
      "Feedback on chatting, notifications, or communicating with other users.",
  },
  {
    id: "booking-payments",
    label: "Booking & Payments",
    description:
      "Suggestions for improving the rental flow, checkout experience, pricing clarity, or payment handling.",
  },
  {
    id: "notifications-emails",
    label: "Notifications & Emails",
    description: "Suggestions for, or feedback of, emails or notifications.",
  },
  {
    id: "design-performance",
    label: "Design, Performance, & Accessibility",
    description:
      "Suggestions related to visual design, ease of use, mobile experience, speed, or accessibility of the platform.",
  },
  {
    id: "other",
    label: "Other",
    description:
      "General feedback, missing features, or ideas that don't fit into a specific category.",
  },
];

export function FeedbackModal({
  isOpen,
  onOpenChange,
}: FeedbackModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const getCategoryLabel = (categoryId: string): string => {
    const category = feedbackCategories.find((c) => c.id === categoryId);
    return category ? category.label : categoryId;
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      console.error("Missing required data for feedback submission");
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackLabels = selectedCategories.map(getCategoryLabel);

      // TODO: API endpoint will be implemented when database table is ready
      // const response = await apiFetch("feedback/create", {
      //   method: "POST",
      //   headers: { "content-type": "application/json" },
      //   body: JSON.stringify({
      //     categories: feedbackLabels,
      //     details: additionalDetails,
      //   }),
      // });

      // const data = await response.json().catch(() => ({}));

      // if (data.ok) {
      //   // Reset form and close feedback modal
      //   setSelectedCategories([]);
      //   setAdditionalDetails("");
      //   onOpenChange(false);

      //   // Show confirmation modal
      //   setIsConfirmationOpen(true);
      // } else {
      //   console.error("Failed to submit feedback:", data.error);
      //   alert("Failed to submit feedback. Please try again.");
      // }

      // For now, just show success
      setSelectedCategories([]);
      setAdditionalDetails("");
      onOpenChange(false);
      setIsConfirmationOpen(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("An error occurred while submitting the feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setSelectedCategories([]);
    setAdditionalDetails("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 pr-8">
              <div>
                <h3 className="text-base font-medium mb-4 pr-8">
                  Please select one or more categories that best describe your
                  response:
                </h3>

                <div className="space-y-4">
                  {feedbackCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) =>
                            handleCategoryChange(
                              category.id,
                              checked as boolean,
                            )
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={category.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.label}
                          </label>
                        </div>
                      </div>

                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors ml-8">
                          <span className="mr-1">More details</span>
                          <ChevronDown className="h-3 w-3" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-8 mt-2">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {category.description}
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold block pr-8">
                  Additional details
                </label>
                <Textarea
                  placeholder="Please provide any additional information about your feedback..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="min-h-[100px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 pr-4"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 [@media(min-width:500px)]:flex-row">
                <Button
                  onClick={handleSubmit}
                  disabled={selectedCategories.length === 0 || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback submitted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm leading-relaxed text-muted-foreground space-y-3">
              <p>Thank you for your feedback! We appreciate you taking the time to help us improve.</p>
            </div>
            <Button
              onClick={() => setIsConfirmationOpen(false)}
              className="w-full"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
