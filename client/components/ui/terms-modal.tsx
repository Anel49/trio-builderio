import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ isOpen, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Last updated: December 15, 2024</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">
                1. Acceptance of Terms
              </h3>
              <p className="text-muted-foreground">
                By accessing and using Trio, you accept and agree to be bound by
                these Terms of Service. If you do not agree to these terms,
                please do not use our platform.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                2. Description of Service
              </h3>
              <p className="text-muted-foreground mb-4">
                Trio is a peer-to-peer marketplace that allows users to rent and
                lend items to each other. We provide the platform to facilitate
                these transactions but are not a party to the rental agreements.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                3. User Responsibilities
              </h3>
              <p className="text-muted-foreground mb-4">
                As a user of Trio, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the security of your account</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Treat other users with respect and courtesy</li>
                <li>Only list items you own or have permission to rent</li>
                <li>Accurately describe items and their condition</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                4. Prohibited Activities
              </h3>
              <p className="text-muted-foreground mb-4">You may not:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>List illegal, stolen, or prohibited items</li>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate intellectual property rights</li>
                <li>Attempt to circumvent our platform or fees</li>
                <li>Use automated systems to access our services</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                5. Payments and Fees
              </h3>
              <p className="text-muted-foreground mb-4">
                Trio charges service fees for successful rentals. These fees are
                clearly disclosed before completing any transaction. Payment
                processing is handled by secure third-party providers.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                6. Limitation of Liability
              </h3>
              <p className="text-muted-foreground">
                Trio is not responsible for the condition, safety, or legality
                of items listed, the truth or accuracy of listings, or the
                ability of users to complete transactions. We provide the
                platform "as is" without warranties of any kind.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                7. Dispute Resolution
              </h3>
              <p className="text-muted-foreground">
                Any disputes arising from these terms or your use of Trio shall
                be resolved through binding arbitration rather than in court,
                except where prohibited by law.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                8. Changes to Terms
              </h3>
              <p className="text-muted-foreground">
                We may update these terms from time to time. We will notify
                users of significant changes via email or through our platform.
                Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                9. Contact Information
              </h3>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, contact us at
                legal@trio.com or through our support channels.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
