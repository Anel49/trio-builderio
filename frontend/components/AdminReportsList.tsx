import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [reportFor, setReportFor] = useState<"listing" | "user">(
    initialReportFor,
  );
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  const limit = 20;
  const offset = currentPage * limit;

  const getSearchPlaceholder = () => {
    if (reportFor === "listing") {
      return "Search using a report number, assigned technician, listing ID, or status...";
    }
    return "Search using a report number, username, assigned technician, or status...";
  };

  useEffect(() => {
    setSearch(initialSearch);
    setReportFor(initialReportFor);
    setCurrentPage(0);
  }, [initialSearch, initialReportFor]);

  useEffect(() => {
    loadReports();
  }, [currentPage, search, reportFor]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        report_for: reportFor,
      });
      if (search) params.append("search", search);

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
      ) : reports.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No reports found</p>
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
                    Report Number
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Status
                  </th>
                  {reportFor === "user" && (
                    <th
                      className={combineTokens(spacing.padding.md, "text-left")}
                    >
                      Reported User
                    </th>
                  )}
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Reasons
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Assigned To
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
                {reports.map((report) => {
                  const reasons = getReportReasons(report.report_reasons);
                  return (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className={spacing.padding.md}>
                        <span
                          className={cn(
                            typography.weight.medium,
                            "text-primary",
                          )}
                        >
                          {report.report_number || "N/A"}
                        </span>
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
                      {reportFor === "user" && (
                        <td className={spacing.padding.md}>
                          {report.reported_user_username ? (
                            <a
                              href={`/profile/${report.reported_user_username}`}
                              onClick={(e) => {
                                if (
                                  !e.ctrlKey &&
                                  !e.metaKey &&
                                  e.button === 0
                                ) {
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
                })}
              </tbody>
            </table>
          </div>

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
