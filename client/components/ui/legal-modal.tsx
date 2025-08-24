import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function LegalModal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: LegalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">{children}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Privacy Policy Content
export const PrivacyContent = () => (
  <>
    <section>
      <h3 className="text-lg font-semibold mb-3">Information We Collect</h3>
      <p className="text-muted-foreground mb-4">
        We collect information you provide directly to us, such as when you
        create an account, list a product, make a rental, or contact us for
        support.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Display name</li>
        <li>Profile picture (optional)</li>
        <li>Defaul zip code (optional)</li>
        <li>User listings</li>
        <li>User reviews</li>
        <li>Submitted reviews</li>
        <li>Associated Google, Facebook, Microsoft, or Apple account</li>
        <li>Direct messages</li>
        <li>Support ticket details and content</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">
        How We Use Your Information
      </h3>
      <p className="text-muted-foreground mb-4">
        We use the information we collect to provide, maintain, and improve our
        services.
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
      <h3 className="text-lg font-semibold mb-3">Information Sharing</h3>
      <p className="text-muted-foreground mb-4">
        We don't sell your personal information. We may share your information
        in the following circumstances:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>With other users as necessary to facilitate rentals</li>
        <li>With service providers who help us operate our platform</li>
        <li>When required by law or to protect our rights</li>
        <li>In connection with a business transfer or merger</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Data Security</h3>
      <p className="text-muted-foreground">
        We implement appropriate security measures to protect your personal
        information against unauthorized access, alteration, disclosure, or
        destruction. However, no internet transmission is completely secure, and
        we cannot guarantee absolute security.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Your Rights</h3>
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
      <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
      <p className="text-muted-foreground">
        If you have any questions about this Privacy Policy, please contact us
        at privacy@trio.com or through our support channels.
      </p>
    </section>
  </>
);

// Terms of Service Content
export const TermsContent = () => (
  <>
    <section>
      <h3 className="text-lg font-semibold mb-3">Acceptance of Terms</h3>
      <p className="text-muted-foreground">
        By accessing and using Trio, you accept and agree to be bound by these
        Terms of Service. If you do not agree to these terms, please do not use
        our platform.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Description of Service</h3>
      <p className="text-muted-foreground mb-4">
        Trio is a peer-to-peer marketplace that allows users to rent and lend
        items to each other. We provide the platform to facilitate these
        transactions but are not a party to the rental agreements.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">User Responsibilities</h3>
      <p className="text-muted-foreground mb-4">
        As a user of Trio, you agree to:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Provide accurate and up-to-date information</li>
        <li>Use the platform in compliance with all applicable laws</li>
        <li>Respect other users and their property</li>
        <li>Honor your rental agreements and commitments</li>
        <li>Report any issues or disputes promptly</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Prohibited Activities</h3>
      <p className="text-muted-foreground mb-4">You may not:</p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>List illegal, stolen, or dangerous items</li>
        <li>Engage in fraudulent or deceptive practices</li>
        <li>Harass, threaten, or harm other users</li>
        <li>Circumvent our payment or security systems</li>
        <li>
          Use the platform for commercial purposes beyond personal rentals
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Payment and Fees</h3>
      <p className="text-muted-foreground">
        Trio charges service fees for successful rentals. Fees are clearly
        displayed before you complete a transaction. All payments are processed
        securely through our payment partners.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Limitation of Liability</h3>
      <p className="text-muted-foreground">
        Trio is not liable for damages arising from rentals, disputes between
        users, or loss of items. Users participate at their own risk and are
        encouraged to use our insurance options.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Changes to Terms</h3>
      <p className="text-muted-foreground">
        We may update these terms from time to time. We'll notify you of
        significant changes via email or platform notifications.
      </p>
    </section>
  </>
);

// Cookie Policy Content
export const CookiesContent = () => (
  <>
    <section>
      <h3 className="text-lg font-semibold mb-3">What Are Cookies</h3>
      <p className="text-muted-foreground">
        Cookies are small text files that are placed on your computer or mobile
        device when you visit our website. They help us provide you with a
        better experience by remembering your preferences and how you use our
        site.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">How We Use Cookies</h3>
      <p className="text-muted-foreground mb-4">
        We use cookies for several purposes:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Keep you signed in to your account</li>
        <li>Remember your preferences and settings</li>
        <li>Understand how you use our platform</li>
        <li>Improve our services and user experience</li>
        <li>Provide personalized content and recommendations</li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Types of Cookies</h3>
      <p className="text-muted-foreground mb-4">
        We use different types of cookies:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>
          <strong>Essential cookies:</strong> Required for the platform to
          function properly
        </li>
        <li>
          <strong>Performance cookies:</strong> Help us understand how users
          interact with our site
        </li>
        <li>
          <strong>Functionality cookies:</strong> Remember your preferences and
          settings
        </li>
        <li>
          <strong>Marketing cookies:</strong> Used to show you relevant
          advertisements
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Managing Cookies</h3>
      <p className="text-muted-foreground mb-4">
        You can control cookies through your browser settings:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Block all cookies or only third-party cookies</li>
        <li>Delete existing cookies from your device</li>
        <li>Set your browser to notify you when cookies are being used</li>
        <li>Choose which types of cookies to allow</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Note that disabling cookies may affect the functionality of our
        platform.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Third-Party Cookies</h3>
      <p className="text-muted-foreground">
        Some of our partners may also place cookies on your device when you use
        our platform. These include payment processors, analytics providers, and
        advertising networks. We don't control these third-party cookies.
      </p>
    </section>

    <section>
      <h3 className="text-lg font-semibold mb-3">Updates to This Policy</h3>
      <p className="text-muted-foreground">
        We may update this Cookie Policy from time to time. Any changes will be
        posted on this page with an updated revision date.
      </p>
    </section>
  </>
);
