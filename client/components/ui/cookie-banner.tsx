import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CookieBannerProps {
  isOpen: boolean;
  onAccept: (preferences: CookiePreferences) => void;
}

export interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}

export function CookieBanner({ isOpen, onAccept }: CookieBannerProps) {
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences>(
    {
      necessary: true, // Always required
      preferences: false,
      statistics: false,
      marketing: false,
    },
  );

  const [activeTab, setActiveTab] = useState("consent");

  const handleToggle = (type: keyof CookiePreferences) => {
    if (type === "necessary") return; // Can't disable necessary cookies

    setCookiePreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleEnableAll = () => {
    const allEnabled = {
      necessary: true,
      preferences: true,
      statistics: true,
      marketing: true,
    };
    setCookiePreferences(allEnabled);
    onAccept(allEnabled);
  };

  const handleDisableAll = () => {
    const onlyNecessary = {
      necessary: true,
      preferences: false,
      statistics: false,
      marketing: false,
    };
    setCookiePreferences(onlyNecessary);
    onAccept(onlyNecessary);
  };

  const handleSavePreferences = () => {
    onAccept(cookiePreferences);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full md:w-3/5 lg:w-2/5 mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Cookie Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="consent">Consent</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="consent" className="space-y-6">
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, provide
                personalized content, and analyze our traffic. You can choose
                which types of cookies to accept.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <h4 className="text-sm font-medium mb-2">Necessary</h4>
                  <Button
                    variant={
                      cookiePreferences.necessary ? "default" : "outline"
                    }
                    className="w-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    {cookiePreferences.necessary ? "ON" : "OFF"}
                  </Button>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium mb-2">Preferences</h4>
                  <Button
                    variant={
                      cookiePreferences.preferences ? "default" : "outline"
                    }
                    className="w-full"
                    onClick={() => handleToggle("preferences")}
                  >
                    {cookiePreferences.preferences ? "ON" : "OFF"}
                  </Button>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium mb-2">Statistics</h4>
                  <Button
                    variant={
                      cookiePreferences.statistics ? "default" : "outline"
                    }
                    className="w-full"
                    onClick={() => handleToggle("statistics")}
                  >
                    {cookiePreferences.statistics ? "ON" : "OFF"}
                  </Button>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-medium mb-2">Marketing</h4>
                  <Button
                    variant={
                      cookiePreferences.marketing ? "default" : "outline"
                    }
                    className="w-full"
                    onClick={() => handleToggle("marketing")}
                  >
                    {cookiePreferences.marketing ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleEnableAll} className="flex-1">
                  Enable All Cookies
                </Button>
                <Button
                  onClick={handleDisableAll}
                  variant="outline"
                  className="flex-1"
                >
                  Disable All Cookies
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  variant="secondary"
                  className="flex-1"
                >
                  Save Preferences
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Necessary</h4>
                  <p className="text-muted-foreground">
                    Essential cookies for basic website functionality, security,
                    and navigation. These cannot be disabled as they are
                    required for the site to work properly.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Preferences</h4>
                  <p className="text-muted-foreground">
                    Cookies that remember your choices and settings to provide a
                    more personalized experience, such as language preferences
                    and display settings.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Statistics</h4>
                  <p className="text-muted-foreground">
                    Analytics cookies that help us understand how visitors
                    interact with our website by collecting and reporting
                    information anonymously.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Marketing</h4>
                  <p className="text-muted-foreground">
                    Cookies used to track visitors across websites and display
                    personalized advertisements based on your interests and
                    browsing behavior.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setActiveTab("consent")}
                  variant="outline"
                >
                  Back to Consent
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
