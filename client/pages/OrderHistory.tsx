import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import Header from "@/components/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
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
} from "lucide-react";

type OrderStatus = "completed" | "active" | "cancelled" | "upcoming" | "pending";
type OrderType = "rented" | "hosted";

interface Order {
  id: string;
  itemName: string;
  itemImage: string;
  host: string;
  hostAvatar: string;
  renter?: string;
  renterAvatar?: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: OrderStatus;
  type: OrderType;
  location: string;
  rating?: number;
  reviewText?: string;
}

export default function OrderHistory() {
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

  // Local state for orders so we can mutate (e.g., cancel)
  const [ordersState, setOrdersState] = useState<Order[]>(orders);

  // Date range filters
  const [orderDateRange, setOrderDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [requestDateRange, setRequestDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Persistent hide completed
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    try { return localStorage.getItem("orderHistoryHideCompleted") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("orderHistoryHideCompleted", hideCompleted ? "1" : "0"); } catch {}
  }, [hideCompleted]);

  useEffect(() => {
    document.title = "Orders and Requests";
  }, []);

  const orders: Order[] = [
    {
      id: "ORD-2024-001",
      itemName: "Professional Lawn Mower",
      itemImage:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=300&h=200&fit=crop&auto=format",
      host: "Sarah",
      hostAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612f672?w=64&h=64&fit=crop&auto=format",
      startDate: "Dec 15, 2024",
      endDate: "Dec 17, 2024",
      amount: 135,
      status: "completed",
      type: "rented",
      location: "94102",
      rating: 5,
      reviewText:
        "Great experience! The lawn mower worked perfectly and Sarah was very responsive.",
    },
    {
      id: "ORD-2024-002",
      itemName: "Designer Wedding Dress",
      itemImage:
        "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=300&h=200&fit=crop&auto=format",
      host: "You",
      hostAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
      renter: "Emily",
      renterAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
      startDate: "Dec 20, 2024",
      endDate: "Dec 22, 2024",
      amount: 255,
      status: "active",
      type: "hosted",
      location: "94607",
    },
    {
      id: "ORD-2024-003",
      itemName: "Complete Tool Set",
      itemImage:
        "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=300&h=200&fit=crop&auto=format",
      host: "Alex",
      hostAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&auto=format",
      startDate: "Dec 25, 2024",
      endDate: "Dec 27, 2024",
      amount: 105,
      status: "upcoming",
      type: "rented",
      location: "94720",
    },
    {
      id: "ORD-2024-004",
      itemName: "Professional Camera Kit",
      itemImage:
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop&auto=format",
      host: "Emma",
      hostAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
      startDate: "Nov 15, 2024",
      endDate: "Nov 17, 2024",
      amount: 225,
      status: "cancelled",
      type: "rented",
      location: "94301",
    },
    {
      id: "ORD-2024-005",
      itemName: "Party Sound System",
      itemImage:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop&auto=format",
      host: "You",
      hostAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
      renter: "David",
      renterAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
      startDate: "Nov 10, 2024",
      endDate: "Nov 12, 2024",
      amount: 165,
      status: "completed",
      type: "hosted",
      location: "95112",
      rating: 4,
    },
  ];

  type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
  interface RequestItem {
    id: string;
    itemName: string;
    itemImage: string;
    requester: string;
    requesterAvatar: string;
    requestedStart: string;
    requestedEnd: string;
    location: string;
    message?: string;
    status: RequestStatus;
    direction: "incoming" | "outgoing";
  }

  const requests: RequestItem[] = [
    {
      id: "REQ-1001",
      itemName: "Party Sound System",
      itemImage:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop&auto=format",
      requester: "Emily",
      requesterAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
      requestedStart: "Jan 12, 2025",
      requestedEnd: "Jan 14, 2025",
      location: "94607",
      status: "pending",
      direction: "incoming",
    },
    {
      id: "REQ-1002",
      itemName: "Professional Camera Kit",
      itemImage:
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop&auto=format",
      requester: "You",
      requesterAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
      requestedStart: "Jan 20, 2025",
      requestedEnd: "Jan 22, 2025",
      location: "94102",
      status: "approved",
      direction: "outgoing",
    },
    {
      id: "REQ-1003",
      itemName: "Complete Tool Set",
      itemImage:
        "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=300&h=200&fit=crop&auto=format",
      requester: "David",
      requesterAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
      requestedStart: "Feb 2, 2025",
      requestedEnd: "Feb 4, 2025",
      location: "94301",
      status: "rejected",
      direction: "incoming",
    },
  ];

  const getRequestStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
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
function overlapsRange(aStart: Date | null, aEnd: Date | null, fStart?: Date, fEnd?: Date) {
  if (!fStart || !fEnd) return true;
  if (!aStart || !aEnd) return false;
  return aStart <= fEnd && aEnd >= fStart;
}
function canCancelOrder(order: Order) {
  const now = new Date();
  const s = parseDateSafe(order.startDate);
  return (order.status === "upcoming" || order.status === "pending") && (!!s && s > now);
}

const filteredOrders = ordersState.filter((order) => {
  const matchesSearch =
    order.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.renter &&
      order.renter.toLowerCase().includes(searchQuery.toLowerCase()));
  const matchesStatus =
    statusFilter === "all" || order.status === statusFilter;
  const matchesType = typeFilter === "all" || order.type === typeFilter;
  const notCompletedHidden = !hideCompleted || order.status !== "completed";
  const oStart = parseDateSafe(order.startDate);
  const oEnd = parseDateSafe(order.endDate);
  const matchesDate = overlapsRange(oStart, oEnd, orderDateRange.start, orderDateRange.end);

  return matchesSearch && matchesStatus && matchesType && notCompletedHidden && matchesDate;
});

  const filteredRequests = requests.filter((req) => {
  const matchesSearch =
    req.itemName.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
    req.requester.toLowerCase().includes(requestSearchQuery.toLowerCase());
  const matchesStatus =
    requestStatusFilter === "all" || req.status === requestStatusFilter;
  const matchesRequester =
    requesterFilter === "all" || req.direction === requesterFilter;
  const rStart = parseDateSafe(req.requestedStart);
  const rEnd = parseDateSafe(req.requestedEnd);
  const matchesDate = overlapsRange(rStart, rEnd, requestDateRange.start, requestDateRange.end);
  return matchesSearch && matchesStatus && matchesRequester && matchesDate;
});

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aDate = new Date(a.requestedStart).getTime();
    const bDate = new Date(b.requestedStart).getTime();
    return requestSortBy === "recent" ? bDate - aDate : aDate - bDate;
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Orders and Requests</h1>
          <p className="text-muted-foreground">
            Review orders or manage rental requests
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Order History</TabsTrigger>
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
                      onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
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
                      onValueChange={(v) => setTypeFilter(v as OrderType | "all")}
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

                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {orderDateRange.start && orderDateRange.end
                            ? `${format(orderDateRange.start, "MMM dd")} - ${format(orderDateRange.end, "MMM dd")}`
                            : "Date: When"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePicker
                        mode="range"
                        selected={{ from: orderDateRange.start, to: orderDateRange.end } as any}
                        onSelect={(range: any) => {
                          setOrderDateRange({ start: range?.from, end: range?.to });
                        }}
                        numberOfMonths={1}
                        disabled={(date) => false}
                        initialFocus
                      />
                      {(orderDateRange.start || orderDateRange.end) && (
                        <div className="p-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderDateRange({})}
                            className="w-full"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={hideCompleted}
                      onChange={(e) => setHideCompleted(e.target.checked)}
                    />
                    Hide Completed
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No orders found
                    </h3>
                    <p>Try adjusting your search criteria or filters</p>
                  </div>
                  <Button onClick={() => (window.location.href = "/browse")}>
                    Start Browsing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Item Info */}
                      <div className="lg:col-span-2">
                        <div className="flex space-x-4">
                          <img
                            src={order.itemImage}
                            alt={order.itemName}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg">
                                {order.itemName}
                              </h3>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Order #{order.id}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              {order.location}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {order.startDate} - {order.endDate}
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
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={order.hostAvatar}
                                  alt={order.host}
                                />
                                <AvatarFallback>
                                  {order.host
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{order.host}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium mb-2">Renter</p>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={order.renterAvatar}
                                  alt={order.renter}
                                />
                                <AvatarFallback>
                                  {order.renter
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{order.renter}</span>
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
                          <p className="text-2xl font-bold">${order.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.type === "rented" ? "Paid" : "Earned"}
                          </p>
                        </div>

                        <div className="flex gap-2 lg:justify-end">
                          {canCancelOrder(order) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this order?")) {
                                  setOrdersState((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "cancelled" } : o));
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
                              <DropdownMenuRadioGroup>
                                <DropdownMenuRadioItem value="view">
                                  View Details
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="receipt">
                                  Download Receipt
                                </DropdownMenuRadioItem>
                                {order.status === "completed" &&
                                  order.type === "rented" &&
                                  !order.rating && (
                                    <DropdownMenuRadioItem value="review">
                                      Leave Review
                                    </DropdownMenuRadioItem>
                                  )}
                                {(order.status === "upcoming" || order.status === "pending") && (
                                  <DropdownMenuRadioItem value="cancel">
                                    Cancel Order
                                  </DropdownMenuRadioItem>
                                )}
                              </DropdownMenuRadioGroup>
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
          {filteredOrders.length > 0 && (
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
                        <DropdownMenuRadioItem value="approved">
                          Approved
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
                        <Filter className="h-4 w-4 mr-2" />
                        <span>
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

                  <div className="flex flex-col gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>
                            Sort: {requestSortBy === "recent" ? "Most recent" : "Oldest"}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuRadioGroup
                          value={requestSortBy}
                          onValueChange={setRequestSortBy as any}
                        >
                          <DropdownMenuRadioItem value="recent">
                            Most recent
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="oldest">
                            Oldest
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {requestDateRange.start && requestDateRange.end
                              ? `${format(requestDateRange.start, "MMM dd")} - ${format(requestDateRange.end, "MMM dd")}`
                              : "Date: When"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                          mode="range"
                          selected={{ from: requestDateRange.start, to: requestDateRange.end } as any}
                          onSelect={(range: any) => {
                            setRequestDateRange({ start: range?.from, end: range?.to });
                          }}
                          numberOfMonths={1}
                          disabled={() => false}
                          initialFocus
                        />
                        {(requestDateRange.start || requestDateRange.end) && (
                          <div className="p-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestDateRange({})}
                              className="w-full"
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
            {sortedRequests.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex space-x-4">
                        <img
                          src={req.itemImage}
                          alt={req.itemName}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">
                              {req.itemName}
                            </h3>
                            <Badge
                              className={getRequestStatusBadge(req.status)}
                            >
                              {req.status.charAt(0).toUpperCase() +
                                req.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Request #{req.id}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {req.location}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {req.requestedStart} - {req.requestedEnd}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">
                          {req.direction === "incoming"
                            ? "Requester"
                            : "You requested"}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={req.requesterAvatar}
                              alt={req.requester}
                            />
                            <AvatarFallback>
                              {req.requester
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{req.requester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end sm:flex-row sm:items-center sm:justify-end">
                      {req.status === "pending" &&
                        req.direction === "incoming" && (
                          <div className="order-2 sm:order-1 flex gap-2 mt-2 sm:mt-0">
                            <Button size="sm" variant="outline">
                              Decline
                            </Button>
                            <Button size="sm">Approve</Button>
                          </div>
                        )}

                      <div className="order-1 sm:order-2 flex gap-2 flex-wrap sm:flex-nowrap">
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
                            <DropdownMenuRadioGroup>
                              <DropdownMenuRadioItem value="view">
                                View Details
                              </DropdownMenuRadioItem>
                              {req.status === "pending" &&
                                req.direction === "outgoing" && (
                                  <DropdownMenuRadioItem value="withdraw">
                                    Withdraw Request
                                  </DropdownMenuRadioItem>
                                )}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

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
    </div>
  );
}
