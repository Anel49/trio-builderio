import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
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

interface Claim {
  id: number;
  claim_number: string | null;
  status: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  order_id: number;
  order_number: number | null;
  created_by_id: number | null;
  created_by_name: string | null;
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

export default function AdminClaimsList() {
  const { user: currentUser } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  const limit = 6;
  const offset = currentPage * limit;

  useEffect(() => {
    loadClaims();
  }, [currentPage, search]);

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) params.append("search", search);

      const url = `/admin/claims?${params.toString()}`;
      console.log("[AdminClaimsList] Fetching:", url);

      const response = await apiFetch(url);
      console.log("[AdminClaimsList] Response status:", response.status);
      console.log("[AdminClaimsList] Response ok:", response.ok);
      console.log("[AdminClaimsList] Response headers:", response.headers);

      const responseText = await response.text();
      console.log(
        "[AdminClaimsList] Raw response (first 500 chars):",
        responseText.substring(0, 500),
      );

      if (!response.ok) {
        console.error("[AdminClaimsList] Error response received");
        throw new Error(
          `Failed to load claims (${response.status}): ${responseText.substring(0, 200)}`,
        );
      }

      try {
        const data = JSON.parse(responseText);
        console.log("[AdminClaimsList] Data received:", data);
        setClaims(data.claims || []);
        setTotalClaims(data.total || 0);
      } catch (parseErr) {
        console.error("[AdminClaimsList] JSON parse error:", parseErr);
        console.error(
          "[AdminClaimsList] Response was:",
          responseText.substring(0, 1000),
        );
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 200)}`,
        );
      }
    } catch (err: any) {
      console.error("[AdminClaimsList] Error:", err);
      setError(err.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignment = async (claimId: number, assign: boolean) => {
    if (assign && !currentUser?.id) {
      setError("You must be logged in to assign claims");
      return;
    }

    // Find the claim to check if user created it
    const claim = claims.find((c) => c.id === claimId);
    if (assign && claim && claim.created_by_id === currentUser?.id) {
      setError("You cannot assign yourself to a claim you created");
      return;
    }

    try {
      const response = await apiFetch(`/admin/claims/${claimId}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignToId: assign ? currentUser.id : null,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        // Update the claim in state optimistically
        setClaims((prevClaims) =>
          prevClaims.map((claim) =>
            claim.id === claimId
              ? {
                  ...claim,
                  assigned_to: data.claim.assigned_to,
                  assigned_to_name: data.claim.assigned_to_name,
                }
              : claim,
          ),
        );
        // Close the popover after successful assignment
        setOpenPopoverId(null);
      } else {
        setError(data.error || "Failed to update claim assignment");
      }
    } catch (err: any) {
      console.error("[AdminClaimsList] Assignment error:", err);
      setError(err.message || "Failed to update claim assignment");
    }
  };

  const handleStatusChange = async (claimId: number, newStatus: string) => {
    try {
      const response = await apiFetch(`/admin/claims/${claimId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.ok) {
        setClaims((prevClaims) =>
          prevClaims.map((claim) =>
            claim.id === claimId
              ? {
                  ...claim,
                  status: data.claim.status,
                  updated_at: data.claim.updated_at,
                }
              : claim,
          ),
        );
      } else {
        setError(data.error || "Failed to update claim status");
      }
    } catch (err: any) {
      console.error("[AdminClaimsList] Status update error:", err);
      setError(err.message || "Failed to update claim status");
    }
  };

  const totalPages = Math.ceil(totalClaims / limit);
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
          placeholder="Search using a claim number, assigned technician, status, priority, or order ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
          className="flex-1"
        />
      </div>

      {loading ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <Loader2 className="animate-spin" />
        </div>
      ) : claims.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No claims found</p>
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
                    Claim number
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Status
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Priority
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Created by
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Assigned to
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
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b hover:bg-muted/50">
                    <td className={spacing.padding.md}>
                      <a
                        href={`/claims-chat?claimId=${claim.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          typography.weight.medium,
                          "text-primary hover:underline",
                        )}
                      >
                        {claim.claim_number || "N/A"}
                      </a>
                    </td>
                    <td className={spacing.padding.md}>
                      <div className="flex items-center gap-2">
                        <span
                          className={combineTokens(
                            "px-2 py-1 rounded text-xs font-medium",
                            claim.status === "resolved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : claim.status === "rejected" ||
                                  claim.status === "canceled" ||
                                  claim.status === "legal action"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : claim.status === "under review" ||
                                    claim.status ===
                                      "awaiting customer response" ||
                                    claim.status === "reimbursement pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                          )}
                        >
                          {toTitleCase(claim.status)}
                        </span>
                        {claim.assigned_to === currentUser?.id && (
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
                                value={claim.status}
                                onValueChange={(status) =>
                                  handleStatusChange(claim.id, status)
                                }
                              >
                                <DropdownMenuRadioItem value="submitted">
                                  Submitted
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="under review">
                                  Under Review
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="awaiting customer response">
                                  Awaiting Customer Response
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="reimbursement pending">
                                  Reimbursement Pending
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="legal action">
                                  Legal Action
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="canceled">
                                  Canceled
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="rejected">
                                  Rejected
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="resolved">
                                  Resolved
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                    <td className={spacing.padding.md}>
                      <div className="flex items-center gap-2">
                        <p>{claim.assigned_to_name || "Unassigned"}</p>
                        <Popover
                          open={openPopoverId === claim.id}
                          onOpenChange={(open) =>
                            setOpenPopoverId(open ? claim.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 border border-border hover:bg-accent"
                              title={
                                claim.assigned_to === currentUser?.id
                                  ? "Unassign claim"
                                  : "Assign claim"
                              }
                            >
                              {claim.assigned_to === currentUser?.id ? (
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
                                  claim.id,
                                  claim.assigned_to !== currentUser?.id,
                                )
                              }
                              className="w-full px-3 py-2 text-sm text-left rounded hover:bg-accent"
                            >
                              {claim.assigned_to === currentUser?.id
                                ? "Unassign"
                                : "Assign to me"}
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                    <td
                      className={combineTokens(
                        spacing.padding.md,
                        "text-center",
                      )}
                    >
                      <p>{claim.priority}</p>
                    </td>
                    <td className={spacing.padding.md}>
                      <p>ORD-{claim.order_number || claim.order_id}</p>
                    </td>
                    <td className={spacing.padding.md}>
                      <p className="text-xs text-muted-foreground">
                        {formatDateForAdmin(claim.created_at)}
                      </p>
                    </td>
                    <td className={spacing.padding.md}>
                      <p className="text-xs text-muted-foreground">
                        {formatDateForAdmin(claim.updated_at)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={combineTokens(layouts.flex.between, "mt-6")}>
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages} ({totalClaims} total
              claims)
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
