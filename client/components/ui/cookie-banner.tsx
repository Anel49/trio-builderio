import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Cookie, Settings, Shield, BarChart3 } from "lucide-react";

interface CookieBannerProps {
  isOpen: boolean;
  onAccept: (preferences: CookiePreferences) => void;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieBanner({ isOpen, onAccept }: CookieBannerProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  const handleSwitchChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleEnableAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allEnabled);
    onAccept(allEnabled);
  };

  const handleDisableAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(onlyNecessary);
    onAccept(onlyNecessary);
  };

  const handleSavePreferences = () => {
    onAccept(preferences);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left side - Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <Cookie className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                You can customize your preferences below or accept all cookies.
              </p>
              
              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-green-600" />
                    <div>
                      <Label className="font-medium">Necessary</Label>
                      <p className="text-xs text-muted-foreground">Required for basic site functionality</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.necessary}
                    disabled={true}
                    aria-label="Necessary cookies (always enabled)"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <div>
                      <Label className="font-medium">Analytics</Label>
                      <p className="text-xs text-muted-foreground">Help us understand how you use our site</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => handleSwitchChange('analytics', checked)}
                    aria-label="Analytics cookies"
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">📢</span>
                    </div>
                    <div>
                      <Label className="font-medium">Marketing</Label>
                      <p className="text-xs text-muted-foreground">Personalized ads and content</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => handleSwitchChange('marketing', checked)}
                    aria-label="Marketing cookies"
                  />
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-4 w-4 text-orange-600" />
                    <div>
                      <Label className="font-medium">Functional</Label>
                      <p className="text-xs text-muted-foreground">Enhanced features and personalization</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.functional}
                    onCheckedChange={(checked) => handleSwitchChange('functional', checked)}
                    aria-label="Functional cookies"
                  />
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden lg:block" />

            {/* Right side - Actions */}
            <div className="lg:w-64 flex flex-col space-y-3">
              <Button
                onClick={handleEnableAll}
                className="w-full"
                size="lg"
              >
                Enable All Cookies
              </Button>
              
              <Button
                onClick={handleDisableAll}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Disable All Cookies
              </Button>
              
              <Separator />
              
              <Button
                onClick={handleSavePreferences}
                variant="secondary"
                className="w-full"
              >
                Save My Preferences
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                You can change these preferences anytime in your account settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
