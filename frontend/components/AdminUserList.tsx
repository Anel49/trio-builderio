import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AlertCircle, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

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

export default function AdminUserList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );

  const limit = 20;
  const offset = currentPage * limit;

  useEffect(() => {
    loadUsers();
  }, [currentPage, search]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) params.append("search", search);

      const response = await apiFetch(`/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load users");

      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.total);
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
          placeholder="Search by name, email, or username..."
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
      ) : users.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No users found</p>
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
                    Name
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Email
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Admin
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Moderator
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isUpdating = updatingIds.has(user.id);
                  return (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className={spacing.padding.md}>
                        <a
                          href={`/profile/${user.username}`}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                              e.preventDefault();
                              navigate(`/profile/${user.username}`);
                            }
                          }}
                          className={combineTokens(
                            "text-left hover:text-primary transition-colors block",
                          )}
                        >
                          <p className={typography.weight.medium}>
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </a>
                      </td>
                      <td className={spacing.padding.md}>{user.email}</td>
                      <td className={spacing.padding.md}>
                        <Switch
                          checked={user.admin}
                          disabled={isUpdating || !currentUser?.admin}
                          onCheckedChange={(checked) => {
                            setPendingChange({
                              user,
                              field: "admin",
                              value: checked,
                            });
                            setModalOpen(true);
                          }}
                        />
                      </td>
                      <td className={spacing.padding.md}>
                        <Switch
                          checked={user.moderator}
                          disabled={isUpdating || !currentUser?.admin}
                          onCheckedChange={(checked) => {
                            setPendingChange({
                              user,
                              field: "moderator",
                              value: checked,
                            });
                            setModalOpen(true);
                          }}
                        />
                      </td>
                      <td className={spacing.padding.md}>
                        <Switch
                          checked={user.active}
                          disabled={isUpdating}
                          onCheckedChange={(checked) => {
                            setPendingChange({
                              user,
                              field: "active",
                              value: checked,
                            });
                            setModalOpen(true);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={combineTokens(layouts.flex.between, "mt-6")}>
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages} ({totalUsers} total users)
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
