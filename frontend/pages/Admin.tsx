import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  ShoppingCart,
  Star,
  AlertCircle,
  Flag,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";
import AdminUserList from "@/components/AdminUserList";
import AdminListingList from "@/components/AdminListingList";
import AdminOrderList from "@/components/AdminOrderList";
import AdminReviewList from "@/components/AdminReviewList";
import AdminClaimsList from "@/components/AdminClaimsList";
import AdminReportsList from "@/components/AdminReportsList";
import AdminFeedbackList from "@/components/AdminFeedbackList";
import AdminMessages from "@/components/AdminMessages";
import { Footer } from "@/components/Footer";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, authenticated } = useAuth();
  const getDefaultTab = () =>
    user?.admin || user?.moderator ? "users" : "orders";
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileSidebarOpen]);

  if (!authenticated || !user) {
    return (
      <>
        <Header />
        <div className={combineTokens(layouts.flex.center, "min-h-screen")}>
          <Card className="w-full max-w-md">
            <CardContent className={spacing.padding.lg}>
              <div
                className={combineTokens(
                  layouts.flex.colCenter,
                  spacing.gap.md,
                )}
              >
                <AlertCircle
                  className={combineTokens(
                    spacing.dimensions.icon.lg,
                    "text-destructive",
                  )}
                />
                <p className={typography.size.lg}>
                  You must be logged in to access the admin dashboard.
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!user.admin && !user.moderator) {
    return (
      <>
        <Header />
        <div className={combineTokens(layouts.flex.center, "min-h-screen")}>
          <Card className="w-full max-w-md">
            <CardContent className={spacing.padding.lg}>
              <div
                className={combineTokens(
                  layouts.flex.colCenter,
                  spacing.gap.md,
                )}
              >
                <AlertCircle
                  className={combineTokens(
                    spacing.dimensions.icon.lg,
                    "text-destructive",
                  )}
                />
                <p className={typography.size.lg}>
                  You do not have permission to access the admin dashboard.
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const navItems: NavItem[] = [];

  if (user.admin || user.moderator) {
    navItems.push(
      {
        id: "users",
        label: "User Management",
        icon: <Users className={spacing.dimensions.icon.sm} />,
      },
      {
        id: "listings",
        label: "Listing Management",
        icon: <FileText className={spacing.dimensions.icon.sm} />,
      },
      {
        id: "orders",
        label: "Order Management",
        icon: <ShoppingCart className={spacing.dimensions.icon.sm} />,
      },
      {
        id: "reviews",
        label: "Review Management",
        icon: <Star className={spacing.dimensions.icon.sm} />,
      },
      {
        id: "reports",
        label: "Reports",
        icon: <Flag className={spacing.dimensions.icon.sm} />,
      },
      {
        id: "claims",
        label: "Claims",
        icon: <AlertCircle className={spacing.dimensions.icon.sm} />,
      },
      {
        id: "feedback",
        label: "Feedback Submissions",
        icon: <MessageSquare className={spacing.dimensions.icon.sm} />,
      },
    );
  }

  if (user.admin) {
    navItems.push({
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className={spacing.dimensions.icon.sm} />,
    });
  }

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminUserList />
            </CardContent>
          </Card>
        );
      case "listings":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Listing Management</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminListingList />
            </CardContent>
          </Card>
        );
      case "orders":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminOrderList />
            </CardContent>
          </Card>
        );
      case "reviews":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Review Management</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminReviewList />
            </CardContent>
          </Card>
        );
      case "reports":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminReportsList />
            </CardContent>
          </Card>
        );
      case "claims":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Claims</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminClaimsList />
            </CardContent>
          </Card>
        );
      case "feedback":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Feedback Submissions</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AdminFeedbackList />
            </CardContent>
          </Card>
        );
      case "messages":
        return (
          <Card className="border-0 rounded-none h-full flex flex-col">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <AdminMessages />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      {/* Main Content - 25/75 Split */}
      <div className="h-[calc(100vh-4rem)]">
        <div className="h-full flex overflow-hidden">
          {/* Left Side - Navigation (25%) */}
          <div className="hidden lg:block w-1/4 bg-muted/30 overflow-hidden border-r border-border">
            <div className={spacing.padding.card}>
              <h2
                className={combineTokens(
                  typography.combinations.subheading,
                  spacing.margin.bottomMd,
                )}
              >
                Admin Dashboard
              </h2>
              <nav className={combineTokens(spacing.gap.sm, "flex flex-col")}>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={combineTokens(
                      "flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors",
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {item.icon}
                    <span className={typography.size.sm}>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Side - Content Area (75%) */}
          <div className="flex-1 bg-background overflow-hidden">
            <div className="h-full">{renderContent()}</div>
          </div>
        </div>
      </div>

      {/* Mobile Admin Floating Button - Only visible on mobile/tablet */}
      <Button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg lg:hidden z-30"
        size="icon"
      >
        {isMobileSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Admin Sidebar - Slides up from bottom */}
      <div
        className={`fixed inset-x-0 top-16 bottom-0 z-20 border-t lg:hidden transition-transform duration-300 ease-in-out bg-background dark:bg-background ${
          isMobileSidebarOpen ? "translate-y-0" : "translate-y-[130%]"
        }`}
      >
        <div className={spacing.padding.card}>
          <h2
            className={combineTokens(
              typography.combinations.subheading,
              spacing.margin.bottomMd,
            )}
          >
            Admin Dashboard
          </h2>
          <nav className={combineTokens(spacing.gap.sm, "flex flex-col")}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={combineTokens(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {item.icon}
                <span className={typography.size.sm}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <Footer />
    </>
  );
}
