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
import { apiFetch } from "@/lib/api";

interface ReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle?: string;
  listingId?: number;
  listingData?: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    addons?: Array<{ item: string; style: string | null }>;
  };
}

const reportCategories = [
  {
    id: "misleading-info",
    label: "Misleading or False Information",
    description:
      "Includes misleading or false details about the product such as the wrong manufacturer, nonexistent features, or exaggerated claims that could mislead users.",
  },
  {
    id: "misleading-images",
    label: "Misleading Images",
    description:
      "Includes images that do not accurately represent the product such as stock images, edited or filtered images, or images of a different product.",
  },
  {
    id: "inappropriate-images",
    label: "Inappropriate Images",
    description:
      "Includes sexual or sexually suggestive images, depictions of drug or alcohol use, offensive gestures, violent or graphic content, or images intended to shock or provoke.",
  },
  {
    id: "inappropriate-content",
    label: "Inappropriate Title or Description",
    description:
      "Includes curse words, pejoratives, slurs, sexual innuendos, discriminatory language, or references to illegal or unsafe behavior.",
  },
  {
    id: "spam",
    label: "Spam",
    description:
      "Includes promotional content, repeated or irrelevant text, links to external websites, or attempts to direct users off-platform for booking or communication.",
  },
];

export function ReportModal({
  isOpen,
  onOpenChange,
  listingTitle,
  listingId,
  listingData,
}: ReportModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
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
    const category = reportCategories.find((c) => c.id === categoryId);
    return category ? category.label : categoryId;
  };

  const handleSubmit = async () => {
    if (!listingId || !listingData || selectedCategories.length === 0) {
      console.error("Missing required data for report submission");
      return;
    }

    setIsSubmitting(true);

    try {
      const reportLabels = selectedCategories.map(getCategoryLabel);

      const response = await apiFetch("reports/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          report_for: "listing",
          reported_id: listingId,
          report_reasons: reportLabels,
          report_details: additionalDetails,
          listing_data: listingData,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (data.ok) {
        // Reset form and close report modal
        setSelectedCategories([]);
        setAdditionalDetails("");
        setIsDetailsExpanded(false);
        onOpenChange(false);

        // Show confirmation modal
        setIsConfirmationOpen(true);
      } else {
        console.error("Failed to submit report:", data.error);
        alert("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("An error occurred while submitting the report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setSelectedCategories([]);
    setAdditionalDetails("");
    setIsDetailsExpanded(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            {listingTitle && (
              <p className="text-sm text-muted-foreground">
                Reporting: "{listingTitle}"
              </p>
            )}
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 pr-8">
              <div>
                <h3 className="text-base font-medium mb-4 pr-8">
                  Please select one or more categories that best describe the
                  issue:
                </h3>

                <div className="space-y-4">
                  {reportCategories.map((category) => (
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
                          {isDetailsExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
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
                  placeholder="Please provide any additional information about this report..."
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
                  {isSubmitting ? "Submitting..." : "Submit Report"}
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
            <DialogTitle>Report submitted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {listingTitle} has been reported.
              <br />
              Thank you! Your report plays an important part in keeping our
              communities safe.
            </p>
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
