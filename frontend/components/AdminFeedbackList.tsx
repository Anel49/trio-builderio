import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface Feedback {
  id: number;
  status: string;
  categories: any;
  details: string;
  created_by_id: number;
  created_by_name: string | null;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
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

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCategories(categoriesJson: any): string[] {
  if (!categoriesJson) return [];
  if (typeof categoriesJson === "string") {
    try {
      const parsed = JSON.parse(categoriesJson);
      return parsed.categories || [];
    } catch {
      return [];
    }
  }
  return categoriesJson.categories || [];
}

export default function AdminFeedbackList() {
  const { user: currentUser } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastSearchedTerm, setLastSearchedTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const limit = 6;
  const offset = currentPage * limit;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!search.trim()) return;

    setCurrentPage(0);
    loadFeedback(0);
  };

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        show_completed: showCompleted.toString(),
      });
      if (search) params.append("search", search);

      const url = `/admin/feedback?${params.toString()}`;
      console.log("[AdminFeedbackList] Fetching:", url);

      const response = await apiFetch(url);
      console.log("[AdminFeedbackList] Response status:", response.status);
      console.log("[AdminFeedbackList] Response ok:", response.ok);

      const responseText = await response.text();
      console.log(
        "[AdminFeedbackList] Raw response (first 500 chars):",
        responseText.substring(0, 500),
      );

      if (!response.ok) {
        console.error("[AdminFeedbackList] Error response received");
        throw new Error(
          `Failed to load feedback (${response.status}): ${responseText.substring(0, 200)}`,
        );
      }

      try {
        const data = JSON.parse(responseText);
        console.log("[AdminFeedbackList] Data received:", data);
        setFeedback(data.feedback || []);
        setTotalFeedback(data.total || 0);
      } catch (parseErr) {
        console.error("[AdminFeedbackList] JSON parse error:", parseErr);
        console.error(
          "[AdminFeedbackList] Response was:",
          responseText.substring(0, 1000),
        );
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 200)}`,
        );
      }
    } catch (err: any) {
      console.error("[AdminFeedbackList] Error:", err);
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignment = async (
    feedbackId: number,
    assign: boolean,
  ) => {
    if (assign && !currentUser?.id) {
      setError("You must be logged in to assign feedback");
      return;
    }

    try {
      const response = await apiFetch(`/admin/feedback/${feedbackId}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignToId: assign ? currentUser.id : null,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setFeedback((prevFeedback) =>
          prevFeedback.map((item) =>
            item.id === feedbackId
              ? {
                  ...item,
                  assigned_to_id: data.feedback.assigned_to_id,
                  assigned_to_name: data.feedback.assigned_to_name,
                }
              : item,
          ),
        );
        setOpenPopoverId(null);
      } else {
        setError(data.error || "Failed to update feedback assignment");
      }
    } catch (err: any) {
      console.error("[AdminFeedbackList] Assignment error:", err);
      setError(err.message || "Failed to update feedback assignment");
    }
  };

  const handleStatusChange = async (feedbackId: number, newStatus: string) => {
    try {
      const response = await apiFetch(`/admin/feedback/${feedbackId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.ok) {
        setFeedback((prevFeedback) =>
          prevFeedback.map((item) =>
            item.id === feedbackId
              ? {
                  ...item,
                  status: data.feedback.status,
                  updated_at: data.feedback.updated_at,
                }
              : item,
          ),
        );
      } else {
        setError(data.error || "Failed to update feedback status");
      }
    } catch (err: any) {
      console.error("[AdminFeedbackList] Status update error:", err);
      setError(err.message || "Failed to update feedback status");
    }
  };

  const totalPages = Math.ceil(totalFeedback / limit);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

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

      <div className={combineTokens(layouts.flex.between, "gap-4")}>
        <Input
          type="text"
          placeholder="Search by ID, status, submitter name, or assignee..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
          className="flex-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-completed-feedback"
          checked={showCompleted}
          onCheckedChange={(checked) => {
            setShowCompleted(checked === true);
            setCurrentPage(0);
          }}
        />
        <label
          htmlFor="show-completed-feedback"
          className={combineTokens(typography.size.sm, "cursor-pointer")}
        >
          Show Completed
        </label>
      </div>

      {loading ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <Loader2 className="animate-spin" />
        </div>
      ) : feedback.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No feedback found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto themed-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    ID
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Status
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Categories
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Assigned To
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Details
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Submitted by
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Created
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => {
                  const categories = getCategories(item.categories);
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className={spacing.padding.md}>
                        <span
                          className={cn(
                            typography.weight.medium,
                            "text-primary",
                          )}
                        >
                          {item.id}
                        </span>
                      </td>
                      <td className={spacing.padding.md}>
                        <div className="flex items-center gap-2">
                          <span
                            className={combineTokens(
                              "px-2 py-1 rounded text-xs font-medium",
                              item.status === "submitted"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : item.status === "triaged"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                  : item.status === "under review"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : item.status === "planned" ||
                                        item.status === "in progress"
                                      ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
                                      : item.status === "implemented"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : item.status === "declined" ||
                                            item.status === "duplicate" ||
                                            item.status === "out of scope"
                                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                            )}
                          >
                            {toTitleCase(item.status)}
                          </span>
                          {item.assigned_to_id === currentUser?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  title="Change status"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuRadioGroup
                                  value={item.status}
                                  onValueChange={(status) =>
                                    handleStatusChange(item.id, status)
                                  }
                                >
                                  <DropdownMenuRadioItem value="submitted">
                                    Submitted
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="triaged">
                                    Triaged
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="under review">
                                    Under Review
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="planned">
                                    Planned
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="in progress">
                                    In Progress
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="implemented">
                                    Implemented
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="declined">
                                    Declined
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="duplicate">
                                    Duplicate
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="out of scope">
                                    Out Of Scope
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                      <td className={spacing.padding.md}>
                        <div className="flex flex-col gap-1">
                          {categories.length > 0 ? (
                            categories.map((category, idx) => (
                              <p
                                key={idx}
                                className="text-xs text-muted-foreground"
                              >
                                {category}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No categories
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={spacing.padding.md}>
                        <div className="flex items-center gap-2">
                          <p>{item.assigned_to_name || "Unassigned"}</p>
                          <Popover
                            open={openPopoverId === item.id}
                            onOpenChange={(open) =>
                              setOpenPopoverId(open ? item.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 border border-border hover:bg-accent"
                                title={
                                  item.assigned_to_id === currentUser?.id
                                    ? "Unassign feedback"
                                    : "Assign feedback"
                                }
                              >
                                {item.assigned_to_id === currentUser?.id ? (
                                  <Minus className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent side="left" className="w-40 p-2">
                              <button
                                onClick={() =>
                                  handleToggleAssignment(
                                    item.id,
                                    item.assigned_to_id !== currentUser?.id,
                                  )
                                }
                                className="w-full px-3 py-2 text-sm text-left rounded hover:bg-accent"
                              >
                                {item.assigned_to_id === currentUser?.id
                                  ? "Unassign"
                                  : "Assign to me"}
                              </button>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                      <td className={spacing.padding.md}>
                        <p className="text-xs text-muted-foreground max-w-sm truncate">
                          {item.details}
                        </p>
                      </td>
                      <td className={spacing.padding.md}>
                        <p className="text-xs">
                          {item.created_by_name || "Unknown"}
                        </p>
                      </td>
                      <td className={spacing.padding.md}>
                        <p className="text-xs text-muted-foreground">
                          {formatDateForAdmin(item.created_at)}
                        </p>
                      </td>
                      <td className={spacing.padding.md}>
                        <p className="text-xs text-muted-foreground">
                          {formatDateForAdmin(item.updated_at)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={combineTokens(layouts.flex.between, "mt-6")}>
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages} ({totalFeedback} total
              feedback)
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
