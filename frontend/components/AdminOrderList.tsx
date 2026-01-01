import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";
import { format } from "date-fns";

const ORDER_STATUSES = ["pending", "active", "completed", "canceled"];

interface Order {
  id: number;
  listing_id: number;
  listing_title: string;
  renter_id: number;
  renter_name: string | null;
  renter_email: string | null;
  host_name: string | null;
  host_email: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const limit = 20;
  const offset = currentPage * limit;

  useEffect(() => {
    loadOrders();
  }, [currentPage]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/admin/orders?limit=${limit}&offset=${offset}`;

      const response = await apiFetch(url);
      if (!response.ok) throw new Error("Failed to load orders");

      const data = await response.json();
      setOrders(data.orders);
      setTotalOrders(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingIds((prev) => new Set([...prev, orderId]));
    try {
      const response = await apiFetch(`/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update order");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (err: any) {
      setError(err.message || "Failed to update order");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const totalPages = Math.ceil(totalOrders / limit);
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


      {loading ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <Loader2 className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className={combineTokens(layouts.flex.center, "py-12")}>
          <p className="text-muted-foreground">No orders found</p>
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
                    Listing
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Renter
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Dates
                  </th>
                  <th
                    className={combineTokens(spacing.padding.md, "text-left")}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isUpdating = updatingIds.has(order.id);
                  const startDate = new Date(order.start_date);
                  const endDate = new Date(order.end_date);

                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className={spacing.padding.md}>
                        <div>
                          <p className={typography.weight.medium}>
                            {order.listing_title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {order.listing_id}
                          </p>
                        </div>
                      </td>
                      <td className={spacing.padding.md}>
                        <div>
                          <p className={typography.weight.medium}>
                            {order.renter_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.renter_email}
                          </p>
                        </div>
                      </td>
                      <td className={spacing.padding.md}>
                        <div className="text-xs">
                          <p>
                            {format(startDate, "MMM dd, yyyy")} -{" "}
                            {format(endDate, "MMM dd, yyyy")}
                          </p>
                        </div>
                      </td>
                      <td className={spacing.padding.md}>
                        <Select
                          value={order.status}
                          disabled={isUpdating}
                          onValueChange={(newStatus) =>
                            handleStatusChange(order.id, newStatus)
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={combineTokens(layouts.flex.between, "mt-6")}>
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages} ({totalOrders} total
              orders)
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
