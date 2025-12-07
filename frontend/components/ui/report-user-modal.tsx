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

interface ReportUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
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
  userName,
}: ReportUserModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const handleSubmit = () => {
    console.log("User report submitted:", {
      categories: selectedCategories,
      details: additionalDetails,
      userName,
    });

    setSelectedCategories([]);
    setAdditionalDetails("");
    onOpenChange(false);

    setIsConfirmationOpen(true);
  };

  const handleClose = () => {
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
            <div className="space-y-6 pr-6">
              <div>
                <h3 className="text-base font-medium mb-4 pr-4">
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
              <p className="font-bold">{userName} has been reported.</p>
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
