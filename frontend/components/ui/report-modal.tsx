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

interface ReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle?: string;
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
}: ReportModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const handleSubmit = () => {
    // TODO: Implement report submission logic
    console.log("Report submitted:", {
      categories: selectedCategories,
      details: additionalDetails,
      listing: listingTitle,
    });

    // Reset form and close report modal
    setSelectedCategories([]);
    setAdditionalDetails("");
    setIsDetailsExpanded(false);
    onOpenChange(false);

    // Show confirmation modal
    setIsConfirmationOpen(true);
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

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">
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
                        <CollapsibleTrigger className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors ml-6">
                          <span className="mr-1">More details</span>
                          {isDetailsExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-6 mt-2">
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
                <label className="text-sm font-bold block">
                  Additional details
                </label>
                <Textarea
                  placeholder="Please provide any additional information about this report..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="min-h-[100px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={selectedCategories.length === 0}
                  className="flex-1"
                >
                  Submit Report
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
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
            <DialogTitle className="text-center">Report Submitted</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div>
              <p className="font-bold">{listingTitle} has been reported.</p>
              <p className="text-sm text-muted-foreground mt-2">
                We appreciate your care and concern!
              </p>
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
