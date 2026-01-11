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
import { COMPANY_NAME } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

interface ReportUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number;
  userName?: string;
  onUserBlocked?: () => void;
}

const reportCategories = [
  {
    id: "harassment",
    label: "Harassment",
    description:
      "Repeated or targeted behavior meant to annoy, embarrass, or harm.",
  },
  {
    id: "hateful-language",
    label: "Hateful language",
    description:
      "Messages meant to attack or demean based on appearance, race, gender or sex, disability, religion, political affiliation, occupation, or education.",
  },
  {
    id: "threats",
    label: "Threats",
    description:
      "Messages threatening action to cause physical, emotional, social, digital, or financial harm.",
  },
  {
    id: "intimidation",
    label: "Intimidation",
    description: "Actions or messages meant to frighten or coerce.",
  },
  {
    id: "inappropriate-messages",
    label: "Inappropriate Messages",
    description:
      "Messages that are sexually explicit or unfit for public display.",
  },
  {
    id: "spam",
    label: "Spam",
    description: `Unsolicited messages sent to disrupt, advertise, or direct users off the ${COMPANY_NAME} platform.`,
  },
  {
    id: "impersonation",
    label: "Impersonation",
    description: "Messages pretending to be another person or entity.",
  },
  {
    id: "other",
    label: "Other (please specify)",
    description: "",
  },
];

export function ReportUserModal({
  isOpen,
  onOpenChange,
  userId,
  userName,
  onUserBlocked,
}: ReportUserModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlockingUser, setIsBlockingUser] = useState(false);

  const getCategoryLabel = (categoryId: string): string => {
    const category = reportCategories.find((c) => c.id === categoryId);
    return category ? category.label : categoryId;
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const handleBlockUser = async () => {
    if (!userId) return;

    setIsBlockingUser(true);
    try {
      const response = await apiFetch("blocks/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: userId }),
      });

      const data = await response.json().catch(() => ({}));

      if (data.ok) {
        // Close confirmation modal
        setIsConfirmationOpen(false);
        // Close main report modal
        onOpenChange(false);
      } else {
        console.error("Failed to block user:", data.error);
        alert("Failed to block user. Please try again.");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("An error occurred while blocking the user.");
    } finally {
      setIsBlockingUser(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId || selectedCategories.length === 0) {
      console.error("Missing required data for user report submission");
      return;
    }

    setIsSubmitting(true);

    try {
      const reportLabels = selectedCategories.map(getCategoryLabel);

      const response = await apiFetch("reports/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          report_for: "user",
          reported_id: userId,
          report_reasons: reportLabels,
          report_details: additionalDetails,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (data.ok) {
        // Reset form and close report modal
        setSelectedCategories([]);
        setAdditionalDetails("");
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
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            {userName && (
              <p className="text-sm text-muted-foreground">
                Reporting: "{userName}"
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

                      {category.description && (
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
                      )}
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
            <div className="text-sm leading-relaxed text-muted-foreground space-y-3">
              <p>{userName} has been reported.</p>
              <p>
                Thank you! Your report plays an important part in keeping our
                communities safe.
              </p>
              <p>Would you also like to block this user?</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleBlockUser}
                disabled={isBlockingUser}
                className="w-full"
              >
                {isBlockingUser ? "Blocking..." : `Block ${userName}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsConfirmationOpen(false)}
                disabled={isBlockingUser}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
