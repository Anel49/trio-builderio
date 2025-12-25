import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, ShoppingCart, Star, AlertCircle } from "lucide-react";
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

export default function Admin() {
  const navigate = useNavigate();
  const { user, authenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  if (!authenticated || !user) {
    return (
      <>
        <Header />
        <Container>
          <div className={combineTokens(layouts.flex.center, "min-h-screen")}>
            <Card className="w-full max-w-md">
              <CardContent className={spacing.padding.lg}>
                <div
                  className={combineTokens(
                    layouts.flex.colCenter,
                    spacing.gap.md
                  )}
                >
                  <AlertCircle className={combineTokens(
                    spacing.dimensions.icon.lg,
                    "text-destructive"
                  )} />
                  <p className={typography.size.lg}>
                    You must be logged in to access the admin panel.
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  if (!user.admin && !user.moderator) {
    return (
      <>
        <Header />
        <Container>
          <div className={combineTokens(layouts.flex.center, "min-h-screen")}>
            <Card className="w-full max-w-md">
              <CardContent className={spacing.padding.lg}>
                <div
                  className={combineTokens(
                    layouts.flex.colCenter,
                    spacing.gap.md
                  )}
                >
                  <AlertCircle className={combineTokens(
                    spacing.dimensions.icon.lg,
                    "text-destructive"
                  )} />
                  <p className={typography.size.lg}>
                    You do not have permission to access the admin panel.
                  </p>
                  <Button onClick={() => navigate("/")} className="w-full">
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Container>
        <div className={combineTokens(spacing.padding.section, "min-h-screen")}>
          <div className={combineTokens(spacing.margin.bottomLg)}>
            <h1 className={typography.combinations.heading}>Admin Dashboard</h1>
            <p className={combineTokens(
              typography.size.lg,
              "text-muted-foreground",
              spacing.margin.topMd
            )}>
              Manage platform content and users
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-8">
              {user.admin && (
                <>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className={spacing.dimensions.icon.sm} />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="listings" className="flex items-center gap-2">
                    <FileText className={spacing.dimensions.icon.sm} />
                    <span className="hidden sm:inline">Listings</span>
                  </TabsTrigger>
                </>
              )}
              {(user.admin || user.moderator) && (
                <>
                  <TabsTrigger value="orders" className="flex items-center gap-2">
                    <ShoppingCart className={spacing.dimensions.icon.sm} />
                    <span className="hidden sm:inline">Orders</span>
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex items-center gap-2">
                    <Star className={spacing.dimensions.icon.sm} />
                    <span className="hidden sm:inline">Reviews</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {user.admin && (
              <>
                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminUserList />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="listings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Listing Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminListingList />
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}

            {(user.admin || user.moderator) && (
              <>
                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminOrderList />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Moderation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminReviewList />
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </Container>
      <Footer />
    </>
  );
}
