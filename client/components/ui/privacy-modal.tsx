import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ isOpen, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>Last updated: December 15, 2024</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">
                1. Information We Collect
              </h3>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, such as when
                you create an account, list a product, make a rental, or contact
                us for support.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Personal information (name, email, phone number)</li>
                <li>Profile information and photos</li>
                <li>Payment and billing information</li>
                <li>Product listings and descriptions</li>
                <li>Communication records and reviews</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                2. How We Use Your Information
              </h3>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to provide, maintain, and
                improve our services.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Process rentals and facilitate transactions</li>
                <li>Verify identity and prevent fraud</li>
                <li>Send important notifications and updates</li>
                <li>Provide customer support</li>
                <li>Improve our platform and develop new features</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                3. Information Sharing
              </h3>
              <p className="text-muted-foreground mb-4">
                We don't sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>With other users as necessary to facilitate rentals</li>
                <li>With service providers who help us operate our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. However, no internet transmission is
                completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Your Rights</h3>
              <p className="text-muted-foreground mb-4">
                You have certain rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and personal information</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of certain communications</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please
                contact us at privacy@trio.com or through our support channels.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
