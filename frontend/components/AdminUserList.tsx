import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

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

function formatDateUTC(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${month} ${day}, ${year}, ${hours}:${minutes}:${seconds} UTC`;
}

interface User {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  admin: boolean;
  moderator: boolean;
  active: boolean;
  createdAt: string;
  pendingIdentityVer: boolean | null;
}

interface PendingChange {
  user: User;
  field: "admin" | "moderator" | "active";
  value: boolean;
}

interface AdminUserListProps {
  onViewUserReports?: (username: string) => void;
}

export default function AdminUserList({
  onViewUserReports,
}: AdminUserListProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastSearchedTerm, setLastSearchedTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );
  const [showInactive, setShowInactive] = useState(false);

  const limit = 15;
  const offset = currentPage * limit;

  useEffect(() => {
    loadUsers(0, false);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    setCurrentPage(0);
    setLastSearchedTerm(search);
    loadUsers(0, undefined, search);
  };

  const loadUsers = async (
    pageNum: number = currentPage,
    showInactiveOverride?: boolean,
    searchTerm?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const pageOffset = pageNum * limit;
      const showInactiveValue =
        showInactiveOverride !== undefined
          ? showInactiveOverride
          : showInactive;
      const finalSearchTerm =
        searchTerm !== undefined ? searchTerm : lastSearchedTerm;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: pageOffset.toString(),
        show_inactive: showInactiveValue.toString(),
      });
      if (finalSearchTerm.trim())
        params.append("search", finalSearchTerm.trim());

      const response = await apiFetch(`/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load users");

      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.total);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const getModalContent = (change: PendingChange) => {
    const { user, field, value } = change;
    const userName = user.name || user.username || "User";
    const userHandle = user.username || "unknown";

    if (field === "admin" || field === "moderator") {
      const choice = value ? "grant" : "remove";
      const privilege = field;
      const title = `${choice.charAt(0).toUpperCase() + choice.slice(1)} ${privilege.charAt(0).toUpperCase() + privilege.slice(1)} Privileges`;
      const description = `Are you sure you want to ${choice} ${privilege} privileges to ${userName} (@${userHandle})?`;
      return { title, description };
    } else if (field === "active") {
      const choice = value ? "activate" : "deactivate";
      const title = `${choice.charAt(0).toUpperCase() + choice.slice(1)} ${userName} (@${userHandle})`;
      const description = `Are you sure you want to ${choice} ${userName}'s (@${userHandle}) account?`;
      return { title, description };
    }

    return { title: "Confirm Change", description: "Are you sure?" };
  };

  const handleConfirmChange = async () => {
    if (!pendingChange) return;

    const { user, field, value } = pendingChange;
    setModalOpen(false);
    setPendingChange(null);

    const updates: Partial<User> = { [field]: value };
    await handleUpdateUser(user.id, updates);
  };

  const handleUpdateUser = async (userId: number, updates: Partial<User>) => {
    setUpdatingIds((prev) => new Set([...prev, userId]));
    try {
      const response = await apiFetch(`/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update user");

      const data = await response.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const totalPages = Math.ceil(totalUsers / limit);
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
          placeholder="Search using a name, email, or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          className="flex-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-inactive-users"
          checked={showInactive}
          onCheckedChange={(checked) => {
            const newShowInactive = checked === true;
            setShowInactive(newShowInactive);
            setCurrentPage(0);
            loadUsers(0, newShowInactive);
          }}
        />
        <label
          htmlFor="show-inactive-users"
          className={combineTokens(typography.size.sm, "cursor-pointer")}
        >
          Show Inactive
        </label>
      </div>

      <div className="overflow-x-auto themed-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                Name
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                Email
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                Verified
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                Active
              </th>
              <th className={combineTokens(spacing.padding.md, "text-left")}>
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-4">
                  <div className={combineTokens(layouts.flex.center, "py-8")}>
                    <Loader2 className="animate-spin" />
                  </div>
                </td>
              </tr>
            ) : users.length === 0 && hasSearched ? (
              <tr>
                <td colSpan={7} className="py-4"></td>
              </tr>
            ) : (
              users.map((user) => {
                const isUpdating = updatingIds.has(user.id);
                return (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className={spacing.padding.md}>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/profile/${user.username}`}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                              e.preventDefault();
                              navigate(`/profile/${user.username}`);
                            }
                          }}
                          className={combineTokens(
                            "text-left hover:text-primary transition-colors block flex-1",
                          )}
                        >
                          <p className={combineTokens(typography.weight.medium, "flex items-center gap-2")}>
                            {user.name}
                            {user.admin && (
                              <span
                                className="font-bold text-primary text-xs"
                                title="Admin"
                              >
                                A
                              </span>
                            )}
                            {!user.admin && user.moderator && (
                              <span
                                className="font-bold text-primary text-xs"
                                title="Moderator"
                              >
                                M
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </a>
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {user.admin && (
                            <span
                              className="font-bold text-primary text-sm"
                              title="Admin"
                            >
                              A
                            </span>
                          )}
                          {!user.admin && user.moderator && (
                            <span
                              className="font-bold text-primary text-sm"
                              title="Moderator"
                            >
                              M
                            </span>
                          )}
                          <button
                            onClick={() => {
                              onViewUserReports?.(user.username || "");
                            }}
                            className="flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                            title="View reports for this user"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className={spacing.padding.md}>{user.email}</td>
                    <td className={spacing.padding.md}>
                      {user.pendingIdentityVer === false ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : user.pendingIdentityVer === null ? (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700"
                        >
                          Not started
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"
                        >
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className={spacing.padding.md}>
                      {user.active ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                    <td className={spacing.padding.md}>
                      <p className="text-xs text-muted-foreground">
                        {formatDateUTC(user.createdAt)}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && users.length === 0 && hasSearched && (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className={combineTokens(layouts.flex.between, "mt-6")}>
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({totalUsers} total users)
          </div>
          <div className={combineTokens(layouts.flex.start, "gap-2")}>
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrevious}
              onClick={() => {
                const newPage = Math.max(0, currentPage - 1);
                setCurrentPage(newPage);
                loadUsers(newPage);
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
                loadUsers(newPage);
              }}
            >
              <ChevronRight className={spacing.dimensions.icon.sm} />
            </Button>
          </div>
        </div>
      )}

      {pendingChange && (
        <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>
              {getModalContent(pendingChange).title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getModalContent(pendingChange).description}
            </AlertDialogDescription>
            <div className={combineTokens(layouts.flex.end, "gap-2")}>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmChange}>
                Yes
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
