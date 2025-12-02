import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/contexts/AuthContext";

// Utility to parse dates without timezone conversion
const parseDateString = (dateStr: string): Date => {
  // Handle YYYY-MM-DD format or ISO format
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    // Manually create date to avoid timezone conversion
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};
import {
  apiFetch,
  updateReservationStatus,
  updateReservationDates,
  createOrderFromReservation,
} from "@/lib/api";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  MapPin,
  MessageCircle,
  Star,
  MoreVertical,
  Download,
  RefreshCw,
  ArrowDownUp,
} from "lucide-react";

type OrderStatus =
  | "completed"
  | "active"
  | "cancelled"
  | "upcoming"
  | "pending";
type OrderType = "rented" | "hosted";
type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled" | "confirmed";

interface Order {
  id: string;
  itemName?: string;
  itemImage?: string;
  host?: string;
  hostAvatar?: string;
  host_avatar_url?: string | null;
  renter?: string;
  renterAvatar?: string;
  renter_avatar_url?: string | null;
  startDate?: string;
  endDate?: string;
  amount?: number;
  status: OrderStatus;
  type?: OrderType;
  location?: string;
  rating?: number;
  reviewText?: string;
  // Database fields for orders
  order_number?: string;
  listing_id?: number;
  host_id?: number | null;
  host_name?: string | null;
  host_email?: string | null;
  host_username?: string | null;
  renter_id?: number | null;
  renter_name?: string | null;
  renter_email?: string | null;
  renter_username?: string | null;
  listing_title?: string | null;
  listing_image?: string | null;
  listing_latitude?: number | null;
  listing_longitude?: number | null;
  daily_price_cents?: number;
  total_days?: number;
  rental_type?: string;
  start_date?: string;
  end_date?: string;
  currency?: string;
  subtotal_cents?: number;
  daily_total?: number;
  tax_cents?: number;
  host_earns?: number;
  renter_pays?: number;
  platform_commission_total?: number;
  total_cents?: number;
  reservation_id?: number | null;
  created_at?: string;
}

interface Reservation {
  id: string;
  listing_id: number;
  renter_id: number;
  host_id: number | null;
  host_name: string | null;
  renter_name: string | null;
  start_date: string;
  end_date: string;
  listing_title: string | null;
  listing_image: string | null;
  listing_latitude: number | null;
  listing_longitude: number | null;
  daily_price_cents: number | null;
  total_days: number | null;
  rental_type: string;
  status: string;
  consumable_addon_total: number;
  nonconsumable_addon_total: number;
  addons: any;
  new_dates_proposed?: string;
  created_at: string;
}

interface UserProfile {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  username: string | null;
}

export default function OrderHistory() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [activeTab, setActiveTab] = useState<"orders" | "requests">("orders");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<
    RequestStatus | "all"
  >("all");
  const [requesterFilter, setRequesterFilter] = useState<
    "all" | "incoming" | "outgoing"
  >("all");
  const [requestSortBy, setRequestSortBy] = useState<"recent" | "oldest">(
    "recent",
  );
  const [orderSortBy, setOrderSortBy] = useState<"recent" | "oldest">("recent");

  // Cancel rental modal state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Post review modal state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");

  // Local state for orders so we can mutate (e.g., cancel)
  const [ordersState, setOrdersState] = useState<Order[]>([]);

  // State for reservations
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<number, UserProfile>>(
    new Map(),
  );
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [processingReservationId, setProcessingReservationId] = useState<
    string | null
  >(null);

  // Request confirmation modal state
  const [requestConfirmModalOpen, setRequestConfirmModalOpen] = useState(false);
  const [requestConfirmAction, setRequestConfirmAction] = useState<
    "accept" | "reject" | null
  >(null);
  const [requestToConfirm, setRequestToConfirm] = useState<Reservation | null>(
    null,
  );

  // Order creation from reservation (for renters)
  const [creatingOrderReservationId, setCreatingOrderReservationId] = useState<
    string | null
  >(null);

  // Booking confirmation modal state
  const [bookingConfirmedModalOpen, setBookingConfirmedModalOpen] =
    useState(false);

  // Date proposal modal state
  const [proposeDateModalOpen, setProposeDateModalOpen] = useState(false);
  const [dateProposalRange, setDateProposalRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [reservationToProposeDates, setReservationToProposeDates] =
    useState<Reservation | null>(null);
  const [dateConfirmModalOpen, setDateConfirmModalOpen] = useState(false);
  const [dateProposalSuccessModalOpen, setDateProposalSuccessModalOpen] =
    useState(false);

  // Persistent hide completed
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("orderHistoryHideCompleted") === "1";
    } catch {
      return false;
    }
  });

  usePageTitle();

  useEffect(() => {
    try {
      localStorage.setItem(
        "orderHistoryHideCompleted",
        hideCompleted ? "1" : "0",
      );
    } catch {}
  }, [hideCompleted]);

  // Fetch reservations and user profiles
  const fetchReservationsAndProfiles = async () => {
    if (!currentUser?.id) return;

    setLoadingReservations(true);
    try {
      console.log(
        `[OrderHistory] Fetching reservations for user ${currentUser.id}`,
      );
      const response = await apiFetch(`/reservations/${currentUser.id}`);
      console.log(`[OrderHistory] Response status: ${response.status}`);

      if (response.status !== 200 && response.status !== 204) {
        const text = await response.text();
        console.error(
          `[OrderHistory] Non-200 response: ${response.status}`,
          text.substring(0, 200),
        );
        setReservations([]);
        setLoadingReservations(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`[OrderHistory] Got reservations:`, data);
        setReservations(data.reservations || []);

        // Fetch user profiles for renters and hosts
        const userIds = new Set<number>();
        data.reservations?.forEach((r: Reservation) => {
          if (r.renter_id) userIds.add(r.renter_id);
          if (r.host_id) userIds.add(r.host_id);
        });

        const profiles = new Map<number, UserProfile>();
        for (const userId of Array.from(userIds)) {
          try {
            const userRes = await apiFetch(`/users/${userId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              profiles.set(userId, userData.user || userData);
            }
          } catch (e) {
            console.error(`Failed to fetch user ${userId}:`, e);
          }
        }
        setUserProfiles(profiles);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
      // Try to get the actual response to debug
      try {
        const debugResponse = await apiFetch(
          `/reservations/${currentUser.id}`,
        );
        const debugText = await debugResponse.text();
        console.log(
          "[OrderHistory] Debug response text (first 500 chars):",
          debugText.substring(0, 500),
        );
      } catch (debugError) {
        console.log("[OrderHistory] Debug fetch also failed:", debugError);
      }
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    fetchReservationsAndProfiles();
  }, [currentUser?.id]);

  const orders: Order[] = [];

  // Fetch orders from the API
  const fetchOrders = async () => {
    if (!currentUser?.id) return;

    try {
      console.log(
        `[OrderHistory] Fetching orders for user ${currentUser.id}`,
      );
      const response = await apiFetch(`/orders/${currentUser.id}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[OrderHistory] Got orders:`, data);

        // Convert database orders to Order format
        const dbOrders = (data.orders || []).map((dbOrder: any) => ({
          id: dbOrder.id,
          order_number: dbOrder.order_number,
          listing_id: dbOrder.listing_id,
          host_id: dbOrder.host_id,
          host_name: dbOrder.host_name,
          host_email: dbOrder.host_email,
          host_username: dbOrder.host_username,
          host_avatar_url: dbOrder.host_avatar_url,
          renter_id: dbOrder.renter_id,
          renter_name: dbOrder.renter_name,
          renter_email: dbOrder.renter_email,
          renter_username: dbOrder.renter_username,
          renter_avatar_url: dbOrder.renter_avatar_url,
          listing_title: dbOrder.listing_title,
          listing_image: dbOrder.listing_image,
          listing_latitude: dbOrder.listing_latitude,
          listing_longitude: dbOrder.listing_longitude,
          daily_price_cents: dbOrder.daily_price_cents,
          total_days: dbOrder.total_days,
          rental_type: dbOrder.rental_type,
          start_date: dbOrder.start_date,
          end_date: dbOrder.end_date,
          status: dbOrder.status || "upcoming",
          currency: dbOrder.currency,
          subtotal_cents: dbOrder.subtotal_cents,
          daily_total: dbOrder.daily_total,
          tax_cents: dbOrder.tax_cents,
          host_earns: dbOrder.host_earns,
          renter_pays: dbOrder.renter_pays,
          platform_commission_total: dbOrder.platform_commission_total,
          total_cents: dbOrder.total_cents,
          reservation_id: dbOrder.reservation_id,
          created_at: dbOrder.created_at,
          itemName: dbOrder.listing_title,
          itemImage: dbOrder.listing_image,
          host: dbOrder.host_name,
          renter: dbOrder.renter_name,
          type: currentUser.id === dbOrder.host_id ? "hosted" : "rented",
        }));

        // Set orders from database
        setOrdersState(dbOrders);
      } else {
        console.error("[OrderHistory] Failed to fetch orders");
        setOrdersState([]);
      }
    } catch (error) {
      console.error("[OrderHistory] Error fetching orders:", error);
      setOrdersState([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser?.id]);

  const getRequestDirection = (
    reservation: Reservation,
  ): "incoming" | "outgoing" => {
    if (!currentUser?.id) return "incoming";
    return reservation.host_id === currentUser.id ? "incoming" : "outgoing";
  };

  const getRequesterName = (reservation: Reservation): string => {
    if (!currentUser?.id) return "Unknown";
    const direction = getRequestDirection(reservation);
    if (direction === "incoming") {
      return reservation.renter_name || "Unknown";
    } else {
      return reservation.host_name || "Unknown";
    }
  };

  const getRequesterUserId = (reservation: Reservation): number | null => {
    if (!currentUser?.id) return null;
    const direction = getRequestDirection(reservation);
    return direction === "incoming"
      ? reservation.renter_id
      : reservation.host_id;
  };

  const getRequestStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "upcoming":
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "active":
        return "Active";
      case "upcoming":
        return "Upcoming";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  function parseDateSafe(s: string): Date | null {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  function canCancelOrder(order: Order) {
    const now = new Date();
    const s = parseDateSafe(order.startDate);
    return (
      (order.status === "upcoming" || order.status === "pending") &&
      !!s &&
      s > now
    );
  }

  const filteredOrders = ordersState.filter((order) => {
    const matchesSearch =
      order.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.renter &&
        order.renter.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.order_number &&
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    const notCompletedHidden = !hideCompleted || order.status !== "completed";
    return matchesSearch && matchesStatus && matchesType && notCompletedHidden;
  });

  const filteredRequests = reservations.filter((res) => {
    const requesterName = getRequesterName(res);
    const matchesSearch =
      (res.listing_title || "")
        .toLowerCase()
        .includes(requestSearchQuery.toLowerCase()) ||
      requesterName.toLowerCase().includes(requestSearchQuery.toLowerCase());
    const matchesStatus =
      requestStatusFilter === "all" ||
      res.status.toLowerCase() === requestStatusFilter.toLowerCase();
    const matchesRequester =
      requesterFilter === "all" || getRequestDirection(res) === requesterFilter;
    return matchesSearch && matchesStatus && matchesRequester;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return requestSortBy === "recent" ? bDate - aDate : aDate - bDate;
  });

  const canReacceptRequest = (reservation: Reservation): boolean => {
    if (reservation.status.toLowerCase() !== "rejected") return false;
    const now = new Date();
    const startDate = new Date(reservation.start_date);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    // Check if current date is at least 1 day before start date
    return startDate.getTime() - now.getTime() >= oneDayInMs;
  };

  const handleRequestStatusUpdate = async (
    reservationId: string,
    status: "pending" | "accepted" | "rejected",
  ) => {
    setProcessingReservationId(reservationId);
    try {
      const result = await updateReservationStatus(reservationId, status);
      if (result.ok && result.reservation) {
        // Update the reservation in the local state
        setReservations((prev) =>
          prev.map((res) =>
            res.id === reservationId
              ? { ...res, status: result.reservation!.status }
              : res,
          ),
        );
        // Close the confirmation modal
        setRequestConfirmModalOpen(false);
        setRequestConfirmAction(null);
        setRequestToConfirm(null);
      } else {
        const errorMsg = result.error || "Unknown error";
        console.error(
          "[handleRequestStatusUpdate] Failed to update status:",
          errorMsg,
        );
        alert(`Failed to update request status: ${errorMsg}`);
      }
    } catch (error) {
      console.error("[handleRequestStatusUpdate] Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setProcessingReservationId(null);
    }
  };

  const handleOpenRequestConfirmModal = (
    reservation: Reservation,
    action: "accept" | "reject",
  ) => {
    setRequestToConfirm(reservation);
    setRequestConfirmAction(action);
    setRequestConfirmModalOpen(true);
  };

  const handleConfirmRequestAction = () => {
    if (!requestToConfirm || !requestConfirmAction) return;
    const statusMap: Record<"accept" | "reject", "accepted" | "rejected"> = {
      accept: "accepted",
      reject: "rejected",
    };
    handleRequestStatusUpdate(
      requestToConfirm.id,
      statusMap[requestConfirmAction],
    );
  };

  const handleConfirmBooking = async (reservation: Reservation) => {
    setCreatingOrderReservationId(reservation.id);
    try {
      const result = await createOrderFromReservation(reservation.id);
      if (result.ok) {
        console.log(
          "[handleConfirmBooking] Order created successfully:",
          result.orderId,
        );
        // Update the reservation status in local state to 'confirmed'
        setReservations((prev) =>
          prev.map((res) =>
            res.id === reservation.id
              ? { ...res, status: "confirmed" }
              : res,
          ),
        );
        // Open the booking confirmed modal
        setBookingConfirmedModalOpen(true);
      } else {
        console.error(
          "[handleConfirmBooking] Failed to create order:",
          result.error,
        );
        alert(`Failed to confirm booking: ${result.error}`);
      }
    } catch (error) {
      console.error("[handleConfirmBooking] Exception:", error);
      alert("An error occurred while confirming your booking.");
    } finally {
      setCreatingOrderReservationId(null);
    }
  };

  const handleOpenProposeDateModal = (reservation: Reservation) => {
    setReservationToProposeDates(reservation);
    setDateProposalRange({ start: null, end: null });
    setProposeDateModalOpen(true);
  };

  const handleConfirmDateProposal = async () => {
    if (
      !reservationToProposeDates ||
      !dateProposalRange.start ||
      !dateProposalRange.end
    ) {
      return;
    }

    // Show confirmation modal
    setDateConfirmModalOpen(true);
    setProposeDateModalOpen(false);
  };

  const handleSubmitDateProposal = async () => {
    if (
      !reservationToProposeDates ||
      !dateProposalRange.start ||
      !dateProposalRange.end
    ) {
      return;
    }

    setProcessingReservationId(reservationToProposeDates.id);
    try {
      // Convert dates to YYYY-MM-DD format to avoid timezone issues
      const formatDateToYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const startDate = formatDateToYYYYMMDD(dateProposalRange.start);
      const endDate = formatDateToYYYYMMDD(dateProposalRange.end);

      const result = await updateReservationDates(
        reservationToProposeDates.id,
        startDate,
        endDate,
      );

      if (result.ok) {
        // Update the reservation in local state with the formatted dates
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationToProposeDates.id
              ? {
                  ...r,
                  start_date: startDate,
                  end_date: endDate,
                  status: "pending",
                }
              : r,
          ),
        );

        setDateConfirmModalOpen(false);
        setReservationToProposeDates(null);
        setDateProposalRange({ start: null, end: null });
        setDateProposalSuccessModalOpen(true);
      } else {
        console.error("[handleSubmitDateProposal] Failed:", result.error);
        alert(`Failed to update dates: ${result.error}`);
      }
    } finally {
      setProcessingReservationId(null);
    }
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aDate = new Date(a.startDate).getTime();
    const bDate = new Date(b.startDate).getTime();
    return orderSortBy === "recent" ? bDate - aDate : aDate - bDate;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hidden">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Rentals and Requests</h1>
          <p className="text-muted-foreground">
            Review orders or manage rental requests
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Rental History</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className={activeTab === "orders" ? "block" : "hidden"}>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>
                        Status:{" "}
                        {statusFilter === "all"
                          ? "All"
                          : getStatusText(statusFilter as OrderStatus)}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup
                      value={statusFilter}
                      onValueChange={(v) =>
                        setStatusFilter(v as OrderStatus | "all")
                      }
                    >
                      <DropdownMenuRadioItem value="all">
                        All Statuses
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="completed">
                        Completed
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="active">
                        Active
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="upcoming">
                        Upcoming
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pending">
                        Pending
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="cancelled">
                        Cancelled
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>
                        Type:{" "}
                        {typeFilter === "all"
                          ? "All"
                          : typeFilter === "rented"
                            ? "Rented"
                            : "Hosted"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup
                      value={typeFilter}
                      onValueChange={(v) =>
                        setTypeFilter(v as OrderType | "all")
                      }
                    >
                      <DropdownMenuRadioItem value="all">
                        All Types
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rented">
                        Items I Rented
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="hosted">
                        Items I Hosted
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() =>
                    setOrderSortBy(
                      orderSortBy === "recent" ? "oldest" : "recent",
                    )
                  }
                >
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  <span>
                    Sort: {orderSortBy === "recent" ? "Most recent" : "Oldest"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hide-completed"
                checked={hideCompleted}
                onCheckedChange={(checked) =>
                  setHideCompleted(checked === true)
                }
              />
              <label
                htmlFor="hide-completed"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Hide Completed
              </label>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {sortedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No rentals found
                    </h3>
                    <p>Try adjusting your search criteria or filters</p>
                  </div>
                  <Button onClick={() => (window.location.href = "/browse")}>
                    Start Browsing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sortedOrders.map((order) => (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Item Info */}
                      <div className="lg:col-span-2">
                        <div className="flex space-x-4">
                          <a
                            href={`/listing/${order.listing_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={order.itemImage || order.listing_image}
                              alt={order.itemName || order.listing_title}
                              className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                            />
                          </a>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <a
                                href={`/listing/${order.listing_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors no-underline"
                              >
                                <h3 className="font-semibold text-lg">
                                  {order.itemName || order.listing_title}
                                </h3>
                              </a>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Order #{order.order_number || order.id}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              {order.location}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {order.start_date
                                ? `${new Date(
                                    order.start_date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })} - ${new Date(
                                    order.end_date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}`
                                : `${order.startDate} - ${order.endDate}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* People Info */}
                      <div className="space-y-3">
                        {order.type === "rented" ? (
                          <div>
                            <p className="text-sm font-medium mb-2">Host</p>
                            <div className="flex items-center space-x-2">
                              <a
                                href={`/profile/${order.host_username || ""}`}
                                aria-label="Open profile"
                                className="no-underline"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={order.host_avatar_url || undefined}
                                    alt={order.host}
                                  />
                                  <AvatarFallback>
                                    {order.host
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              </a>
                              <a
                                href={`/profile/${order.host_username || ""}`}
                                className="text-sm no-underline hover:text-primary transition-colors"
                              >
                                {order.host}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium mb-2">Renter</p>
                            <div className="flex items-center space-x-2">
                              <a
                                href={`/profile/${order.renter_username || ""}`}
                                aria-label="Open profile"
                                className="no-underline"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={order.renter_avatar_url || undefined}
                                    alt={order.renter}
                                  />
                                  <AvatarFallback>
                                    {order.renter
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              </a>
                              <a
                                href={`/profile/${order.renter_username || ""}`}
                                className="text-sm no-underline hover:text-primary transition-colors"
                              >
                                {order.renter}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Rating for completed orders */}
                        {order.status === "completed" && order.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {order.rating}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions & Amount */}
                      <div className="flex flex-col justify-between">
                        <div className="text-right mb-4">
                          {order.host_id || order.renter_id ? (
                            <>
                              <p className="text-2xl font-bold">
                                $
                                {(currentUser?.id === order.host_id
                                  ? (order.host_earns || 0) / 100
                                  : (order.renter_pays || 0) / 100
                                ).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {currentUser?.id === order.host_id
                                  ? "earned"
                                  : "paid"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold">
                                $
                                {(order.amount || 0).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.type === "rented" ? "paid" : "earned"}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2 lg:justify-end">
                          {canCancelOrder(order) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to cancel this rental?",
                                  )
                                ) {
                                  setOrdersState((prev) =>
                                    prev.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: "cancelled" }
                                        : o,
                                    ),
                                  );
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = `/messages`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {}}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {}}>
                                Download Receipt
                              </DropdownMenuItem>
                              {order.status === "completed" &&
                                order.type === "rented" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setReviewOrder(order);
                                      setReviewRating(null);
                                      setReviewText("");
                                      setReviewDialogOpen(true);
                                    }}
                                  >
                                    Post Review
                                  </DropdownMenuItem>
                                )}
                              {(order.status === "upcoming" ||
                                order.status === "pending") && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setOrderToCancel(order);
                                    setCancelReason("");
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  Cancel Rental
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Review Text for completed orders */}
                    {order.reviewText && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm italic">"{order.reviewText}"</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load More */}
          {sortedOrders.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Load More Orders
              </Button>
            </div>
          )}
        </div>

        {activeTab === "requests" && (
          <div className="space-y-4">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requests..."
                      value={requestSearchQuery}
                      onChange={(e) => setRequestSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <Filter className="h-4 w-4 mr-2" />
                        <span>
                          Status:{" "}
                          {requestStatusFilter === "all"
                            ? "All"
                            : requestStatusFilter.charAt(0).toUpperCase() +
                              requestStatusFilter.slice(1)}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={requestStatusFilter}
                        onValueChange={setRequestStatusFilter as any}
                      >
                        <DropdownMenuRadioItem value="all">
                          All
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="pending">
                          Pending
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="accepted">
                          Accepted
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="confirmed">
                          Confirmed
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="rejected">
                          Rejected
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="cancelled">
                          Cancelled
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          Requester:{" "}
                          {requesterFilter === "all"
                            ? "All"
                            : requesterFilter === "outgoing"
                              ? "My requests"
                              : "Requests for me"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={requesterFilter}
                        onValueChange={setRequesterFilter as any}
                      >
                        <DropdownMenuRadioItem value="all">
                          All
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="outgoing">
                          My requests
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="incoming">
                          Requests for me
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      setRequestSortBy(
                        requestSortBy === "recent" ? "oldest" : "recent",
                      )
                    }
                  >
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                    <span>
                      Sort:{" "}
                      {requestSortBy === "recent" ? "Most recent" : "Oldest"}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            {loadingReservations ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <p>Loading requests...</p>
                  </div>
                </CardContent>
              </Card>
            ) : sortedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No requests found
                    </h3>
                    <p>You don't have any rental requests yet</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sortedRequests.map((res) => {
                const direction = getRequestDirection(res);
                const requesterName = getRequesterName(res);
                const requesterUserId = getRequesterUserId(res);
                const requesterProfile = requesterUserId
                  ? userProfiles.get(requesterUserId)
                  : null;
                const startDate = parseDateString(res.start_date);
                const endDate = parseDateString(res.end_date);
                const formattedStart = startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const formattedEnd = endDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <Card
                    key={res.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2">
                          <div className="flex space-x-4">
                            {res.listing_image && (
                              <a
                                href={`/listing/${res.listing_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={res.listing_image}
                                  alt={res.listing_title || "Item"}
                                  className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                                />
                              </a>
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <a
                                  href={`/listing/${res.listing_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors no-underline"
                                >
                                  <h3 className="font-semibold text-lg">
                                    {res.listing_title || "Item"}
                                  </h3>
                                </a>
                                <Badge
                                  className={getRequestStatusBadge(
                                    res.status as RequestStatus,
                                  )}
                                >
                                  {res.status.charAt(0).toUpperCase() +
                                    res.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Request #{res.id}
                              </p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formattedStart} - {formattedEnd}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">
                              {direction === "incoming"
                                ? "Requester"
                                : "You requested"}
                            </p>
                            <div className="flex items-center space-x-2">
                              <a
                                href={`/profile/${requesterProfile?.username || ""}`}
                                aria-label="Open profile"
                                className="no-underline"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={
                                      requesterProfile?.avatarUrl || undefined
                                    }
                                    alt={requesterName}
                                  />
                                  <AvatarFallback>
                                    {requesterName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              </a>
                              <a
                                href={`/profile/${requesterProfile?.username || ""}`}
                                className="text-sm no-underline hover:text-primary transition-colors"
                              >
                                {requesterName}
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end sm:flex-row sm:items-center sm:justify-end">
                          {res.status.toLowerCase() === "pending" &&
                            direction === "incoming" && (
                              <div className="order-2 sm:order-1 flex gap-2 mt-2 sm:mt-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingReservationId === res.id}
                                  onClick={() =>
                                    handleOpenRequestConfirmModal(res, "reject")
                                  }
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={processingReservationId === res.id}
                                  onClick={() =>
                                    handleOpenRequestConfirmModal(res, "accept")
                                  }
                                >
                                  Accept
                                </Button>
                              </div>
                            )}

                          {direction === "outgoing" &&
                            (res.status.toLowerCase() === "accepted" ||
                              res.new_dates_proposed === "sent") &&
                            res.status.toLowerCase() !== "confirmed" && (
                              <div className="order-2 sm:order-1 flex gap-2 mt-2 sm:mt-0">
                                <Button
                                  size="sm"
                                  disabled={
                                    creatingOrderReservationId === res.id
                                  }
                                  onClick={() => handleConfirmBooking(res)}
                                >
                                  {creatingOrderReservationId === res.id
                                    ? "Confirming..."
                                    : "Confirm Booking"}
                                </Button>
                              </div>
                            )}

                          <div className="order-1 sm:order-2 flex gap-2 flex-wrap sm:flex-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/messages`)
                              }
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Message
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {}}>
                                  View Details
                                </DropdownMenuItem>
                                {res.status.toLowerCase() === "pending" &&
                                  direction === "outgoing" && (
                                    <DropdownMenuItem onClick={() => {}}>
                                      Withdraw Request
                                    </DropdownMenuItem>
                                  )}
                                {res.status.toLowerCase() === "rejected" &&
                                  direction === "incoming" &&
                                  canReacceptRequest(res) && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleOpenRequestConfirmModal(
                                          res,
                                          "accept",
                                        )
                                      }
                                    >
                                      Accept request
                                    </DropdownMenuItem>
                                  )}
                                {(res.status.toLowerCase() === "pending" ||
                                  res.status.toLowerCase() === "rejected") &&
                                  res.status.toLowerCase() !== "confirmed" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenProposeDateModal(res)
                                    }
                                  >
                                    Propose new date(s)
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {sortedRequests.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg">
                  Load More Requests
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Rental Modal */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Rental</DialogTitle>
            <DialogDescription>
              What is your reason for cancelling this rental?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              rows={5}
              placeholder="Type your reason here..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                disabled={!cancelReason.trim()}
                onClick={() => {
                  if (!orderToCancel) return;
                  setOrdersState((prev) =>
                    prev.map((o) =>
                      o.id === orderToCancel.id
                        ? { ...o, status: "cancelled" }
                        : o,
                    ),
                  );
                  setCancelDialogOpen(false);
                  setConfirmDialogOpen(true);
                }}
              >
                Cancel Rental
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {orderToCancel
                ? `${orderToCancel.itemName} rental cancelled.`
                : "Rental cancelled."}
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmed Modal */}
      <Dialog
        open={bookingConfirmedModalOpen}
        onOpenChange={(open) => {
          setBookingConfirmedModalOpen(open);
          // Refresh rental history tab when modal closes
          if (!open) {
            fetchOrders();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking confirmed</DialogTitle>
            <DialogDescription>
              Your booking has been confirmed! For complete booking information,
              check the Rental History tab, click or tap the 3 dots, and select
              "View details".
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Post Review Modal */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewOrder ? `Review for ${reviewOrder.itemName}` : "Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star`}
                  onClick={() => setReviewRating(n)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      reviewRating && reviewRating >= n
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              rows={5}
              placeholder="Share your experience (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                disabled={!reviewRating}
                onClick={() => {
                  if (!reviewOrder || !reviewRating) return;
                  setOrdersState((prev) =>
                    prev.map((o) =>
                      o.id === reviewOrder.id
                        ? { ...o, rating: reviewRating, reviewText }
                        : o,
                    ),
                  );
                  setReviewDialogOpen(false);
                }}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Confirmation Modal */}
      <Dialog
        open={requestConfirmModalOpen}
        onOpenChange={setRequestConfirmModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentUser?.id === requestToConfirm?.renter_id
                ? requestConfirmAction === "accept"
                  ? "Accept new date(s)"
                  : "Reject new date(s)"
                : requestConfirmAction === "accept"
                  ? "Accept request"
                  : "Reject request"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-muted-foreground">
              {currentUser?.id === requestToConfirm?.renter_id
                ? requestConfirmAction === "accept"
                  ? "Are you sure you want to accept the proposed date(s)?"
                  : "Are you sure you want to reject the proposed date(s)?"
                : requestConfirmAction === "accept"
                  ? "Are you sure you want to accept this request?"
                  : "Are you sure you want to reject this request?"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRequestConfirmModalOpen(false);
                setRequestConfirmAction(null);
                setRequestToConfirm(null);
              }}
            >
              No
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmRequestAction}
              disabled={
                processingReservationId === requestToConfirm?.id ||
                !requestToConfirm
              }
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Proposal Modal */}
      <Dialog
        open={proposeDateModalOpen}
        onOpenChange={setProposeDateModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Propose new date(s)</DialogTitle>
            <DialogDescription>
              Select new start and end dates for this reservation
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DateRangePicker
              value={dateProposalRange}
              onChange={setDateProposalRange}
              minDate={new Date()}
            />
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setProposeDateModalOpen(false);
                setReservationToProposeDates(null);
                setDateProposalRange({ start: null, end: null });
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!dateProposalRange.start || !dateProposalRange.end}
              onClick={handleConfirmDateProposal}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Confirmation Modal */}
      <Dialog
        open={dateConfirmModalOpen}
        onOpenChange={setDateConfirmModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm new date(s) proposal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-muted-foreground">
              Are you sure you want to propose these new dates for the
              reservation?
            </p>
            {dateProposalRange.start && dateProposalRange.end && (
              <div className="mt-4 p-3 bg-muted rounded">
                <p className="text-sm font-semibold">New dates:</p>
                <p className="text-sm">
                  {dateProposalRange.start.toLocaleDateString()} to{" "}
                  {dateProposalRange.end.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDateConfirmModalOpen(false);
                setProposeDateModalOpen(true);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitDateProposal}
              disabled={
                processingReservationId === reservationToProposeDates?.id ||
                !reservationToProposeDates
              }
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Proposal Success Modal */}
      <Dialog
        open={dateProposalSuccessModalOpen}
        onOpenChange={setDateProposalSuccessModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <p className="text-lg">New date(s) proposal sent!</p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
