import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CookiesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiesModal({ isOpen, onOpenChange }: CookiesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Cookie Policy</DialogTitle>
          <DialogDescription>
            Last updated: December 15, 2024
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. What Are Cookies</h3>
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your computer or mobile device when you 
                visit our website. They help us provide you with a better experience by remembering your 
                preferences and how you use our site.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. How We Use Cookies</h3>
              <p className="text-muted-foreground mb-4">We use cookies for several purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our platform</li>
                <li>Improve our services and user experience</li>
                <li>Provide personalized content and recommendations</li>
                <li>Analyze website traffic and performance</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Types of Cookies We Use</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Essential Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    These cookies are necessary for the website to function properly. They enable basic 
                    functions like page navigation and access to secure areas.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Performance Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    These cookies collect information about how visitors use our website, helping us 
                    improve performance and user experience.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Functionality Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    These cookies allow the website to remember choices you make and provide enhanced, 
                    personalized features.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Analytics Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    We use analytics cookies to understand how our website is being used and to improve 
                    our services based on user behavior.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Third-Party Cookies</h3>
              <p className="text-muted-foreground mb-4">
                We may also use third-party services that set cookies on our behalf:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Google Analytics for website analytics</li>
                <li>Payment processors for secure transactions</li>
                <li>Social media platforms for sharing features</li>
                <li>Customer support tools for help and chat</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Managing Cookies</h3>
              <p className="text-muted-foreground mb-4">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use your browser settings to block or delete cookies</li>
                <li>Adjust your preferences in our cookie settings (when available)</li>
                <li>Opt out of third-party analytics cookies</li>
                <li>Use private/incognito browsing mode</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Please note that blocking certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Updates to This Policy</h3>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or applicable laws. We will notify you of any significant changes.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies, please contact us at cookies@trio.com 
                or through our support channels.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
