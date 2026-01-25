import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ChevronDown,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
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
import { AdminReportChatModal } from "./AdminReportChatModal";
import { AdminReportDetailsModal } from "./AdminReportDetailsModal";
import { MessageCircle } from "lucide-react";

interface Report {
  id: number;
  report_number: string | null;
  status: string;
  report_reasons: any;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  report_for: string;
  reported_id: number;
  reported_user_name: string | null;
  reported_user_username: string | null;
  reported_by_name: string | null;
  reported_by_username: string | null;
  reported_listing_name: string | null;
  reported_listing_id: number | null;
  reported_by_id: number | null;
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

function getReportReasons(reportReasonsJson: any): string[] {
  if (!reportReasonsJson) return [];
  if (typeof reportReasonsJson === "string") {
    try {
      const parsed = JSON.parse(reportReasonsJson);
      return parsed.report_reasons || [];
    } catch {
      return [];
    }
  }
  return reportReasonsJson.report_reasons || [];
}

interface AdminReportsListProps {
  initialReportFor?: "listing" | "user";
  initialSearch?: string;
}

export default function AdminReportsList({
  initialReportFor = "listing",
  initialSearch = "",
}: AdminReportsListProps) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [lastSearchedTerm, setLastSearchedTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [reportFor, setReportFor] = useState<"listing" | "user">(
    initialReportFor,
  );
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedReportForChat, setSelectedReportForChat] =
    useState<Report | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReportIdForDetails, setSelectedReportIdForDetails] = useState<
    number | null
  >(null);
  const [selectedReportForForDetails, setSelectedReportForForDetails] =
    useState<string>("");

  // Filter and sort state
  const [reportNumberFilter, setReportNumberFilter] = useState("");
  const [reportedListingFilter, setReportedListingFilter] = useState("");
  const [reportedUserFilter, setReportedUserFilter] = useState("");
  const [reportedByFilter, setReportedByFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonsFilter, setReasonsFilter] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "updated" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);

  const limit = 15;
  const offset = currentPage * limit;
  const initialLoadDoneRef = React.useRef(false);
  const prevReportForRef = React.useRef(initialReportFor);

  useEffect(() => {
    // Initial load - only runs once on component mount
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      if (initialSearch) {
        setSearch(initialSearch);
        setLastSearchedTerm(initialSearch);
        setHasSearched(true);
      }
      // Load with the provided initial search (or empty string for default load)
      loadReports(0, undefined, initialSearch);
    }
  }, []);

  useEffect(() => {
    // Only load when user manually switches between tabs, not on initial mount
    if (initialLoadDoneRef.current && reportFor !== prevReportForRef.current) {
      prevReportForRef.current = reportFor;
      setCurrentPage(0);
      setSearch("");
      setLastSearchedTerm("");
      setHasSearched(false);
      // Clear all filters when switching tabs
      setReportNumberFilter("");
      setReportedListingFilter("");
      setReportedByFilter("");
      setAssignedToFilter("");
      setStatusFilter("");
      setReasonsFilter("");
      setSortBy(null);
      setSortDirection("desc");
      loadReports(0);
    }
  }, [reportFor]);

  // Load reports when sort changes
  useEffect(() => {
    if (initialLoadDoneRef.current && currentPage === 0) {
      loadReports(0);
    }
  }, [sortBy, sortDirection]);

  const getSearchPlaceholder = () => {
    if (reportFor === "listing") {
      return "Search using a report number, assigned technician, listing ID, or status...";
    }
    return "Search using a report number, username, assigned technician, or status...";
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    setCurrentPage(0);
    setLastSearchedTerm(search);
    setHasSearched(true);
    loadReports(0, undefined, search);
  };

  const loadReports = async (
    pageNum: number = currentPage,
    showCompletedOverride?: boolean,
    searchTerm?: string,
    filters?: {
      reportNumber?: string;
      reportedListing?: string;
      reportedBy?: string;
      assignedTo?: string;
      status?: string;
      reasons?: string;
      sortBy?: "created" | "updated" | null;
      sortDirection?: "asc" | "desc";
    },
  ) => {
    setLoading(true);
    setError(null);
    try {
      const offset = pageNum * limit;
      const showCompletedValue =
        showCompletedOverride !== undefined
          ? showCompletedOverride
          : showCompleted;
      const finalSearchTerm =
        searchTerm !== undefined ? searchTerm : lastSearchedTerm;

      // Use filter overrides if provided, otherwise use state
      const reportNumberVal = filters?.reportNumber !== undefined ? filters.reportNumber : reportNumberFilter;
      const reportedListingVal = filters?.reportedListing !== undefined ? filters.reportedListing : reportedListingFilter;
      const reportedByVal = filters?.reportedBy !== undefined ? filters.reportedBy : reportedByFilter;
      const assignedToVal = filters?.assignedTo !== undefined ? filters.assignedTo : assignedToFilter;
      const statusVal = filters?.status !== undefined ? filters.status : statusFilter;
      const reasonsVal = filters?.reasons !== undefined ? filters.reasons : reasonsFilter;
      const sortByVal = filters?.sortBy !== undefined ? filters.sortBy : sortBy;
      const sortDirVal = filters?.sortDirection !== undefined ? filters.sortDirection : sortDirection;

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        report_for: reportFor,
        show_completed: showCompletedValue.toString(),
      });
      if (finalSearchTerm.trim())
        params.append("search", finalSearchTerm.trim());

      // Add filter parameters
      if (reportNumberVal.trim())
        params.append("report_number_filter", reportNumberVal.trim());
      if (reportedListingVal.trim())
        params.append("reported_listing_filter", reportedListingVal.trim());
      if (reportedByVal.trim())
        params.append("reported_by_filter", reportedByVal.trim());
      if (assignedToVal.trim())
        params.append("assigned_to_filter", assignedToVal.trim());
      if (statusVal)
        params.append("status_filter", statusVal);
      if (reasonsVal)
        params.append("reasons_filter", reasonsVal);

      // Add sort parameters
      if (sortByVal) {
        params.append("sort_by", sortByVal);
        params.append("sort_direction", sortDirVal);
      }

      const url = `/admin/reports?${params.toString()}`;
      console.log("[AdminReportsList] Fetching:", url);

      const response = await apiFetch(url);
      console.log("[AdminReportsList] Response status:", response.status);
      console.log("[AdminReportsList] Response ok:", response.ok);

      const responseText = await response.text();
      console.log(
        "[AdminReportsList] Raw response (first 500 chars):",
        responseText.substring(0, 500),
      );

      if (!response.ok) {
        console.error("[AdminReportsList] Error response received");
        throw new Error(
          `Failed to load reports (${response.status}): ${responseText.substring(0, 200)}`,
        );
      }

      try {
        const data = JSON.parse(responseText);
        console.log("[AdminReportsList] Data received:", data);
        setReports(data.reports || []);
        setTotalReports(data.total || 0);
      } catch (parseErr) {
        console.error("[AdminReportsList] JSON parse error:", parseErr);
        console.error(
          "[AdminReportsList] Response was:",
          responseText.substring(0, 1000),
        );
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 200)}`,
        );
      }
    } catch (err: any) {
      console.error("[AdminReportsList] Error:", err);
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignment = async (reportId: number, assign: boolean) => {
    if (assign && !currentUser?.id) {
      setError("You must be logged in to assign reports");
      return;
    }

    try {
      const response = await apiFetch(`/admin/reports/${reportId}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignToId: assign ? currentUser.id : null,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  assigned_to: data.report.assigned_to,
                  assigned_to_name: data.report.assigned_to_name,
                }
              : report,
          ),
        );
        setOpenPopoverId(null);
      } else {
        setError(data.error || "Failed to update report assignment");
      }
    } catch (err: any) {
      console.error("[AdminReportsList] Assignment error:", err);
      setError(err.message || "Failed to update report assignment");
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    try {
      const response = await apiFetch(`/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.ok) {
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status: data.report.status,
                  updated_at: data.report.updated_at,
                }
              : report,
          ),
        );
      } else {
        setError(data.error || "Failed to update report status");
      }
    } catch (err: any) {
      console.error("[AdminReportsList] Status update error:", err);
      setError(err.message || "Failed to update report status");
    }
  };

  const totalPages = Math.ceil(totalReports / limit);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const handleResetFilters = () => {
    setCurrentPage(0);
    setSearch("");
    setLastSearchedTerm("");
    setHasSearched(false);
    setReportNumberFilter("");
    setReportedListingFilter("");
    setReportedByFilter("");
    setAssignedToFilter("");
    setStatusFilter("");
    setReasonsFilter("");
    setSortBy(null);
    setSortDirection("desc");
    loadReports(0, showCompleted, "", {
      reportNumber: "",
      reportedListing: "",
      reportedBy: "",
      assignedTo: "",
      status: "",
      reasons: "",
      sortBy: null,
      sortDirection: "desc",
    });
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

      <div className="mb-0">
        <Tabs
          value={reportFor}
          onValueChange={(v) => {
            setReportFor(v as "listing" | "user");
            setCurrentPage(0);
            setSearch("");
            setLastSearchedTerm("");
            setHasSearched(false);
            setReports([]);
            setTotalReports(0);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listing">Listing Reports</TabsTrigger>
            <TabsTrigger value="user">User Reports</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={combineTokens(layouts.flex.between, "gap-4")}>
        <Input
          type="text"
          placeholder={getSearchPlaceholder()}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          className="flex-1"
        />
      </div>

      <div className={combineTokens(layouts.flex.between, "gap-4")}>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-completed-reports"
            checked={showCompleted}
            onCheckedChange={(checked) => {
              const newShowCompleted = checked === true;
              setShowCompleted(newShowCompleted);
              setCurrentPage(0);
              loadReports(0, newShowCompleted);
            }}
          />
          <label
            htmlFor="show-completed-reports"
            className={combineTokens(typography.size.sm, "cursor-pointer")}
          >
            Show Completed
          </label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
        >
          Reset filters
        </Button>
      </div>

      <div className="overflow-x-auto themed-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                <div className="flex items-center gap-2">
                  <span>Report number</span>
                  <Popover
                    open={openFilterId === "report_number"}
                    onOpenChange={(open) =>
                      setOpenFilterId(open ? "report_number" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={reportNumberFilter ? "default" : "outline"}
                        size="sm"
                        className="h-6 w-6 pt-[1px] !rounded !border-0"
                        title="Filter by report number"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" className="w-48 p-2">
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter report number..."
                          value={reportNumberFilter}
                          onChange={(e) => setReportNumberFilter(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setCurrentPage(0);
                              loadReports(0);
                              setOpenFilterId(null);
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            setCurrentPage(0);
                            loadReports(0);
                            setOpenFilterId(null);
                          }}
                          className="w-full"
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={statusFilter ? "default" : "outline"}
                        size="sm"
                        className="h-6 w-6 pt-[1px] !rounded !border-0"
                        title="Filter by status"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup
                        value={statusFilter}
                        onValueChange={(newStatus) => {
                          setStatusFilter(newStatus);
                          setCurrentPage(0);
                          loadReports(0);
                        }}
                      >
                        <DropdownMenuRadioItem value="">
                          All Statuses
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="submitted">
                          Submitted
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="rejected">
                          Rejected
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="resolved">
                          Resolved
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="under review">
                          Under Review
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
              {reportFor === "listing" && (
                <th className={combineTokens(spacing.padding.md, "text-left")}>
                  <div className="flex items-center gap-2">
                    <span>Reported listing</span>
                    <Popover
                      open={openFilterId === "reported_listing"}
                      onOpenChange={(open) =>
                        setOpenFilterId(open ? "reported_listing" : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={reportedListingFilter ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 pt-[1px] !rounded !border-0"
                          title="Filter by reported listing"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" className="w-48 p-2">
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter listing name..."
                            value={reportedListingFilter}
                            onChange={(e) => setReportedListingFilter(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setCurrentPage(0);
                                loadReports(0);
                                setOpenFilterId(null);
                              }
                            }}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentPage(0);
                              loadReports(0);
                              setOpenFilterId(null);
                            }}
                            className="w-full"
                          >
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
              )}
              {reportFor === "listing" && (
                <th className={combineTokens(spacing.padding.md, "text-left")}>
                  <div className="flex items-center gap-2">
                    <span>Reported by</span>
                    <Popover
                      open={openFilterId === "reported_by_listing"}
                      onOpenChange={(open) =>
                        setOpenFilterId(open ? "reported_by_listing" : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={reportedByFilter ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 pt-[1px] !rounded !border-0"
                          title="Filter by reported by"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" className="w-48 p-2">
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter username or name..."
                            value={reportedByFilter}
                            onChange={(e) => setReportedByFilter(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setCurrentPage(0);
                                loadReports(0);
                                setOpenFilterId(null);
                              }
                            }}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentPage(0);
                              loadReports(0);
                              setOpenFilterId(null);
                            }}
                            className="w-full"
                          >
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
              )}
              {reportFor === "user" && (
                <th className={combineTokens(spacing.padding.md, "text-left")}>
                  <span>Reported user</span>
                </th>
              )}
              {reportFor === "user" && (
                <th className={combineTokens(spacing.padding.md, "text-left")}>
                  <div className="flex items-center gap-2">
                    <span>Reported by</span>
                    <Popover
                      open={openFilterId === "reported_by_user"}
                      onOpenChange={(open) =>
                        setOpenFilterId(open ? "reported_by_user" : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={reportedByFilter ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 pt-[1px] !rounded !border-0"
                          title="Filter by reported by"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" className="w-48 p-2">
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter username or name..."
                            value={reportedByFilter}
                            onChange={(e) => setReportedByFilter(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setCurrentPage(0);
                                loadReports(0);
                                setOpenFilterId(null);
                              }
                            }}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentPage(0);
                              loadReports(0);
                              setOpenFilterId(null);
                            }}
                            className="w-full"
                          >
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
              )}
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                <div className="flex items-center gap-2">
                  <span>Reasons</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={reasonsFilter ? "default" : "outline"}
                        size="sm"
                        className="h-6 w-6 pt-[1px] !rounded !border-0"
                        title="Filter by reasons"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup
                        value={reasonsFilter}
                        onValueChange={(newReason) => {
                          setReasonsFilter(newReason);
                          setCurrentPage(0);
                          loadReports(0);
                        }}
                      >
                        <DropdownMenuRadioItem value="">
                          All Reasons
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="spam">
                          Spam
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="inappropriate">
                          Inappropriate
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="fraud">
                          Fraud
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="illegal">
                          Illegal
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="other">
                          Other
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                <div className="flex items-center gap-2">
                  <span>Assigned to</span>
                  <Popover
                    open={openFilterId === "assigned_to"}
                    onOpenChange={(open) =>
                      setOpenFilterId(open ? "assigned_to" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={assignedToFilter ? "default" : "outline"}
                        size="sm"
                        className="h-6 w-6 pt-[1px] !rounded !border-0"
                        title="Filter by assigned to"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" className="w-48 p-2">
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter name..."
                          value={assignedToFilter}
                          onChange={(e) => setAssignedToFilter(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setCurrentPage(0);
                              loadReports(0);
                              setOpenFilterId(null);
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            setCurrentPage(0);
                            loadReports(0);
                            setOpenFilterId(null);
                          }}
                          className="w-full"
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  <Button
                    variant={sortBy === "created" ? "default" : "outline"}
                    size="sm"
                    className="h-6 w-6 !rounded !border-0"
                    title="Sort by created"
                    onClick={() => {
                      setCurrentPage(0);
                      if (sortBy === "created") {
                        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("created");
                        setSortDirection("desc");
                      }
                    }}
                  >
                    {sortBy === "created" && sortDirection === "asc" && (
                      <ArrowUpWideNarrow className="h-4 w-4" />
                    )}
                    {sortBy === "created" && sortDirection === "desc" && (
                      <ArrowDownWideNarrow className="h-4 w-4" />
                    )}
                    {sortBy !== "created" && (
                      <ArrowDownWideNarrow className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                <div className="flex items-center gap-2">
                  <span>Updated</span>
                  <Button
                    variant={sortBy === "updated" ? "default" : "outline"}
                    size="sm"
                    className="h-6 w-6 !rounded !border-0"
                    title="Sort by updated"
                    onClick={() => {
                      if (sortBy === "updated") {
                        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("updated");
                        setSortDirection("desc");
                      }
                      setCurrentPage(0);
                    }}
                  >
                    {sortBy === "updated" && sortDirection === "asc" && (
                      <ArrowUpWideNarrow className="h-4 w-4" />
                    )}
                    {sortBy === "updated" && sortDirection === "desc" && (
                      <ArrowDownWideNarrow className="h-4 w-4" />
                    )}
                    {sortBy !== "updated" && (
                      <ArrowDownWideNarrow className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={reportFor === "listing" ? 9 : 9} className="py-4">
                  <div className={combineTokens(layouts.flex.center, "py-8")}>
                    <Loader2 className="animate-spin" />
                  </div>
                </td>
              </tr>
            ) : reports.length === 0 && hasSearched ? (
              <tr>
                <td
                  colSpan={reportFor === "listing" ? 9 : 9}
                  className="py-4"
                ></td>
              </tr>
            ) : (
              reports.map((report) => {
                const reasons = getReportReasons(report.report_reasons);
                return (
                  <tr key={report.id} className="border-b hover:bg-muted/50">
                    <td className={spacing.padding.md}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReportIdForDetails(report.id);
                            setSelectedReportForForDetails(report.report_for);
                            setDetailsModalOpen(true);
                          }}
                          className={cn(
                            typography.weight.medium,
                            "text-primary hover:underline cursor-pointer flex-1",
                          )}
                        >
                          {report.report_number || "N/A"}
                        </button>
                        {reportFor === "user" &&
                          report.assigned_to === currentUser?.id &&
                          report.reported_by_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-transparent flex-shrink-0"
                              title="View chat"
                              onClick={() => {
                                setSelectedReportForChat(report);
                                setChatModalOpen(true);
                              }}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </td>
                    <td className={spacing.padding.md}>
                      <div className="flex items-center gap-2">
                        <span
                          className={combineTokens(
                            "px-2 py-1 rounded text-xs font-medium",
                            report.status === "resolved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : report.status === "rejected" ||
                                  report.status === "dismissed"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : report.status === "under review"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                          )}
                        >
                          {toTitleCase(report.status)}
                        </span>
                        {report.assigned_to === currentUser?.id && (
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
                                value={report.status}
                                onValueChange={(status) =>
                                  handleStatusChange(report.id, status)
                                }
                              >
                                <DropdownMenuRadioItem value="submitted">
                                  Submitted
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
                    {reportFor === "listing" && (
                      <td className={spacing.padding.md}>
                        {report.reported_listing_id &&
                        report.reported_listing_name ? (
                          <a
                            href={`/listing/${report.reported_listing_id}`}
                            onClick={(e) => {
                              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                e.preventDefault();
                                navigate(
                                  `/listing/${report.reported_listing_id}`,
                                );
                              }
                            }}
                            className={combineTokens(
                              "text-left hover:text-primary transition-colors block",
                            )}
                          >
                            <p className={typography.weight.medium}>
                              {report.reported_listing_name}
                            </p>
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Listing not found
                          </p>
                        )}
                      </td>
                    )}
                    {reportFor === "listing" && (
                      <td className={spacing.padding.md}>
                        {report.reported_by_username ? (
                          <a
                            href={`/profile/${report.reported_by_username}`}
                            onClick={(e) => {
                              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                e.preventDefault();
                                navigate(
                                  `/profile/${report.reported_by_username}`,
                                );
                              }
                            }}
                            className={combineTokens(
                              "text-left hover:text-primary transition-colors block",
                            )}
                          >
                            <p className={typography.weight.medium}>
                              {report.reported_by_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{report.reported_by_username}
                            </p>
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            User not found
                          </p>
                        )}
                      </td>
                    )}
                    {reportFor === "user" && (
                      <td className={spacing.padding.md}>
                        {report.reported_user_username ? (
                          <a
                            href={`/profile/${report.reported_user_username}`}
                            onClick={(e) => {
                              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                e.preventDefault();
                                navigate(
                                  `/profile/${report.reported_user_username}`,
                                );
                              }
                            }}
                            className={combineTokens(
                              "text-left hover:text-primary transition-colors block",
                            )}
                          >
                            <p className={typography.weight.medium}>
                              {report.reported_user_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{report.reported_user_username}
                            </p>
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            User not found
                          </p>
                        )}
                      </td>
                    )}
                    {reportFor === "user" && (
                      <td className={spacing.padding.md}>
                        {report.reported_by_username ? (
                          <a
                            href={`/profile/${report.reported_by_username}`}
                            onClick={(e) => {
                              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                e.preventDefault();
                                navigate(
                                  `/profile/${report.reported_by_username}`,
                                );
                              }
                            }}
                            className={combineTokens(
                              "text-left hover:text-primary transition-colors block",
                            )}
                          >
                            <p className={typography.weight.medium}>
                              {report.reported_by_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{report.reported_by_username}
                            </p>
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            User not found
                          </p>
                        )}
                      </td>
                    )}
                    <td className={spacing.padding.md}>
                      <div className="flex flex-col gap-1">
                        {reasons.length > 0 ? (
                          reasons.map((reason, idx) => (
                            <p
                              key={idx}
                              className="text-xs text-muted-foreground"
                            >
                              {reason}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No reasons
                          </p>
                        )}
                      </div>
                    </td>
                    <td className={spacing.padding.md}>
                      <div className="flex items-center gap-2">
                        <p>{report.assigned_to_name || "Unassigned"}</p>
                        {report.reported_by_id !== currentUser?.id && (
                          <Popover
                            open={openPopoverId === report.id}
                            onOpenChange={(open) =>
                              setOpenPopoverId(open ? report.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 border border-border hover:bg-accent"
                                title={
                                  report.assigned_to === currentUser?.id
                                    ? "Unassign report"
                                    : "Assign report"
                                }
                              >
                                {report.assigned_to === currentUser?.id ? (
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
                                    report.id,
                                    report.assigned_to !== currentUser?.id,
                                  )
                                }
                                className="w-full px-3 py-2 text-sm text-left rounded hover:bg-accent"
                              >
                                {report.assigned_to === currentUser?.id
                                  ? "Unassign"
                                  : "Assign to me"}
                              </button>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </td>
                    <td className={spacing.padding.md}>
                      <p className="text-xs text-muted-foreground">
                        {formatDateForAdmin(report.created_at)}
                      </p>
                    </td>
                    <td className={spacing.padding.md}>
                      <p className="text-xs text-muted-foreground">
                        {formatDateForAdmin(report.updated_at)}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && reports.length === 0 && hasSearched && (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No reports found</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className={combineTokens(layouts.flex.between, "mt-6")}>
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({totalReports} total
            reports)
          </div>
          <div className={combineTokens(layouts.flex.start, "gap-2")}>
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrevious}
              onClick={() => {
                const newPage = Math.max(0, currentPage - 1);
                setCurrentPage(newPage);
                loadReports(newPage);
              }}
            >
              <ChevronLeft className={spacing.dimensions.icon.sm} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => {
                const newPage = Math.min(totalPages - 1, currentPage + 1);
                setCurrentPage(newPage);
                loadReports(newPage);
              }}
            >
              <ChevronRight className={spacing.dimensions.icon.sm} />
            </Button>
          </div>
        </div>
      )}

      {selectedReportForChat && (
        <AdminReportChatModal
          open={chatModalOpen}
          onOpenChange={setChatModalOpen}
          reportId={selectedReportForChat.id}
          reportedUserName={selectedReportForChat.reported_user_name}
          reportingUserName={selectedReportForChat.reported_by_name}
        />
      )}

      {selectedReportIdForDetails && (
        <AdminReportDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          reportId={selectedReportIdForDetails}
          reportFor={selectedReportForForDetails}
        />
      )}
    </div>
  );
}
