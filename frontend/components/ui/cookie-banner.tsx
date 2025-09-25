import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

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
      preferences: true,
      statistics: true,
      marketing: true,
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
  };

  const handleDisableAll = () => {
    const onlyNecessary = {
      necessary: true,
      preferences: false,
      statistics: false,
      marketing: false,
    };
    setCookiePreferences(onlyNecessary);
  };

  const handleSavePreferences = () => {
    onAccept(cookiePreferences);
    window.dispatchEvent(new CustomEvent("lendit-cookies-accepted"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center pointer-events-none">
      <div className="w-full max-w-3xl px-4 md:px-6 pointer-events-auto">
        <Card className="w-full md:min-w-[512px] mx-auto">
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3">Necessary</h4>
                    <div className="flex items-center justify-center space-x-3">
                      <Switch
                        checked={cookiePreferences.necessary}
                        disabled={true}
                        className="opacity-50"
                      />
                      <span className="text-sm font-medium">
                        {cookiePreferences.necessary ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3">Preferences</h4>
                    <div className="flex items-center justify-center space-x-3">
                      <Switch
                        checked={cookiePreferences.preferences}
                        onCheckedChange={() => handleToggle("preferences")}
                      />
                      <span className="text-sm font-medium">
                        {cookiePreferences.preferences ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3">Statistics</h4>
                    <div className="flex items-center justify-center space-x-3">
                      <Switch
                        checked={cookiePreferences.statistics}
                        onCheckedChange={() => handleToggle("statistics")}
                      />
                      <span className="text-sm font-medium">
                        {cookiePreferences.statistics ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3">Marketing</h4>
                    <div className="flex items-center justify-center space-x-3">
                      <Switch
                        checked={cookiePreferences.marketing}
                        onCheckedChange={() => handleToggle("marketing")}
                      />
                      <span className="text-sm font-medium">
                        {cookiePreferences.marketing ? "ON" : "OFF"}
                      </span>
                    </div>
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
                    variant="outline"
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
                      Essential cookies for basic website functionality,
                      security, and navigation. These cannot be disabled as they
                      are required for the site to work properly.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Preferences</h4>
                    <p className="text-muted-foreground">
                      Cookies that remember your choices and settings to provide
                      a more personalized experience, such as language
                      preferences and display settings.
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
