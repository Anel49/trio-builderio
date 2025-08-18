import React, { useState } from "react";
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import Header from "@/components/Header";
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

type OrderStatus = "completed" | "active" | "cancelled" | "upcoming";
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

  const orders: Order[] = [
    {
      id: "ORD-2024-001",
      itemName: "Professional Lawn Mower",
      itemImage:
        "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=300&h=200&fit=crop&auto=format",
      host: "Sarah Martinez",
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
      renter: "Emily Chen",
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
      host: "Alex Thompson",
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
      host: "Emma Wilson",
      hostAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
      startDate: "Nov 15, 2024",
      endDate: "Nov 17, 2024",
      amount: 225,
      status: "cancelled",
      type: "rented",
      location: "Palo Alto, CA",
    },
    {
      id: "ORD-2024-005",
      itemName: "Party Sound System",
      itemImage:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop&auto=format",
      host: "You",
      hostAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format",
      renter: "David Rodriguez",
      renterAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
      startDate: "Nov 10, 2024",
      endDate: "Nov 12, 2024",
      amount: 165,
      status: "completed",
      type: "hosted",
      location: "San Jose, CA",
      rating: 4,
    },
  ];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "upcoming":
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
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.renter &&
        order.renter.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
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
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">
            Track your rental transactions and manage your orders
          </p>
        </div>

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
                  <Button variant="outline" className="justify-between">
                    <span>
                      Status:{" "}
                      {statusFilter === "all"
                        ? "All"
                        : getStatusText(statusFilter as OrderStatus)}
                    </span>
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={setStatusFilter}
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
                    <DropdownMenuRadioItem value="cancelled">
                      Cancelled
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    <span>
                      Type:{" "}
                      {typeFilter === "all"
                        ? "All"
                        : typeFilter === "rented"
                          ? "Rented"
                          : "Hosted"}
                    </span>
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={typeFilter}
                    onValueChange={setTypeFilter}
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

              <div className="text-sm text-muted-foreground flex items-center">
                Showing {filteredOrders.length} of {orders.length} orders
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
                              {order.status === "upcoming" && (
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
    </div>
  );
}
