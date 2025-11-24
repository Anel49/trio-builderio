import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, FileText, Shield, Cookie } from "lucide-react";
import { PrivacyContent, CookiesContent } from "@/components/ui/legal-modal";
import {
  COMPANY_NAME,
  SERVICE_FEE,
  INSURANCE_FEE,
  COMPANY_EMAIL,
} from "@/lib/constants";
import { usePageTitle } from "@/hooks/use-page-title";

type PolicyType = "terms" | "privacy" | "cookies";

export default function TermsOfService() {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>("terms");

  usePageTitle();

  const policies = [
    {
      id: "terms" as PolicyType,
      title: "Terms of Service",
      icon: FileText,
      description: "Platform usage terms and conditions",
    },
    {
      id: "privacy" as PolicyType,
      title: "Privacy Policy",
      icon: Shield,
      description: "How we handle your data",
    },
    {
      id: "cookies" as PolicyType,
      title: "Cookie Policy",
      icon: Cookie,
      description: "Our use of cookies and tracking",
    },
  ];

  const renderPolicyContent = () => {
    switch (selectedPolicy) {
      case "privacy":
        return <PrivacyContent />;
      case "cookies":
        return <CookiesContent />;
      case "terms":
      default:
        return <TermsOfServiceContent />;
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ scrollBehavior: "smooth" }}
    >
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Policy Selector - Top on Mobile, Right on Desktop */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="text-lg">Terms & Policies</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a policy to view
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {policies.map((policy) => {
                  const IconComponent = policy.icon;
                  return (
                    <button
                      key={policy.id}
                      onClick={() => setSelectedPolicy(policy.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedPolicy === policy.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent
                          className={`h-5 w-5 mt-0.5 ${
                            selectedPolicy === policy.id
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {policy.title}
                          </h4>
                          <p
                            className={`text-xs mt-1 ${
                              selectedPolicy === policy.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {policy.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Bottom on Mobile, Left on Desktop */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">
                  {policies.find((p) => p.id === selectedPolicy)?.title}
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {renderPolicyContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Terms of Service Content Component
const TermsOfServiceContent = () => (
  <>
    {/* Table of Contents */}
    <section className="bg-muted/30 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
      <nav className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <a
          href="#introduction"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Introduction and Platform Overview
        </a>
        <a
          href="#account-requirements"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Account Requirements and User Responsibilities
        </a>
        <a
          href="#rental-process"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Rental Process and Booking Terms
        </a>
        <a
          href="#payment-terms"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Payment Terms and Fees
        </a>
        <a
          href="#safety-security"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Safety and Security Requirements
        </a>
        <a
          href="#prohibited-items"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Prohibited Items and Activities
        </a>
        <a
          href="#damage-insurance"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Damage, Loss, and Insurance Policies
        </a>
        <a
          href="#dispute-resolution"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Dispute Resolution and Support
        </a>
        <a
          href="#privacy-data"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Privacy and Data Usage
        </a>
        <a
          href="#account-termination"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Account Termination
        </a>
        <a
          href="#legal-disclaimers"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Legal Disclaimers and Limitations
        </a>
        <a
          href="#changes-to-terms"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Changes to Terms of Service
        </a>
        <a
          href="#contact-information"
          className="text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Contact Information
        </a>
      </nav>
    </section>

    <Separator />

    {/* Introduction */}
    <section id="introduction">
      <h2 className="text-2xl font-semibold mb-4">
        Introduction and Platform Overview
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Welcome to {COMPANY_NAME}, a peer-to-peer rental marketplace that
        connects people who want to rent items with those who want to share
        them. By using our platform, you agree to these Terms of Service, which
        govern your relationship with {COMPANY_NAME} and other users.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        {COMPANY_NAME} operates as a platform that facilitates transactions
        between independent users. We do not own, operate, provide, control,
        manage, offer, deliver, or supply any rental items. {COMPANY_NAME} is
        not a party to the rental agreements between users.
      </p>
    </section>

    <Separator />

    {/* Account Requirements */}
    <section id="account-requirements">
      <h2 className="text-2xl font-semibold mb-4">
        Account Requirements and User Responsibilities
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Eligibility</h3>
          <p className="text-muted-foreground leading-relaxed">
            You must be at least 18 years old to use {COMPANY_NAME}. By creating
            an account, you represent that you are legally able to enter into
            binding contracts.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Representation</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your profile name must be your name, a nickname, or your rental
            business name. For your safety, please avoid including your last
            name.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            All profile names must be free of offensive, vulgar, or suggestive
            language and should not include any discriminatory, violent, or
            otherwise inappropriate content. Failure to follow these guidelines
            may result in a forced renaming, suspension, or deletion of your
            account.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Conduct</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            All chat messages must remain respectful and considerate. The
            following conduct is strictly prohibited:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <span className="font-semibold mb-4">
                Offensive or abusive language
              </span>{" "}
              — including insults, slurs, harassment, or bullying.
            </li>
            <li>
              <span className="font-semibold mb-4">
                Vulgar, obscene, or sexually suggestive content
              </span>{" "}
              — in any form, explicit or implied.
            </li>
            <li>
              <span className="font-semibold mb-4">
                Discriminatory or hateful content
              </span>{" "}
              — targeting race, ethnicity, gender, sexuality, religion,
              nationality, disability, or any other protected status.
            </li>
            <li>
              <span className="font-semibold mb-4">
                Violent, graphic, or threatening material
              </span>{" "}
              — including encouragement of self-harm or harm to others.
            </li>
            <li>
              <span className="font-semibold mb-4">
                Illegal or harmful activities
              </span>{" "}
              — including the promotion of drugs, underage content, or criminal
              behavior.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Account Security</h3>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for all activities that occur under your
            account. You must immediately notify us of any unauthorized use of
            your account.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Accurate Information</h3>
          <p className="text-muted-foreground leading-relaxed">
            You agree to provide accurate, current, and complete information on
            listings and to update such information as necessary to keep it
            accurate, current, and complete.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Rental Process */}
    <section id="rental-process">
      <h2 className="text-2xl font-semibold mb-4">
        Rental Process and Booking Terms
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Booking and Confirmation</h3>
          <p className="text-muted-foreground leading-relaxed">
            When you request to rent an item, you're making an offer to enter
            into a rental agreement with the item owner. The rental agreement is
            formed when the owner accepts your request and payment is processed.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Pickup and Return</h3>
          <p className="text-muted-foreground leading-relaxed">
            You must pick up and return the item at the agreed-upon time and
            location. Late returns may result in additional fees. You are
            responsible for coordinating with the owner for pickup and return
            logistics.
          </p>
        </div>
        {/*<div>
          <h3 className="text-lg font-medium mb-2">Cancellation Policy</h3>
          <p className="text-muted-foreground leading-relaxed">
            Cancellations made more than 24 hours before the rental start time
            are eligible for a full refund. Cancellations within 24 hours may be
            subject to fees as determined by the item owner's cancellation
            policy.
          </p>
        </div>*/}
      </div>
    </section>

    <Separator />

    {/* Payment Terms */}
    <section id="payment-terms">
      <h2 className="text-2xl font-semibold mb-4">Payment Terms and Fees</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Service Fees</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Profits from listings incur a {SERVICE_FEE}% platform usage fee,
            charged from the host. This fee covers platform maintenance,
            customer support, and payment processing.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Item rentals incur a {INSURANCE_FEE}% fee of the item’s daily rental
            price, charged from the renter. This fee is to insure the renter
            throughout the rental period. This fee is not charged again with
            rental extensions. Listings providing a service do not incur this fee.
            The renter's maximum out-of-pocket insurance payment is capped at $50.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            These coverages are subject to change based on the platform’s
            performance and growth.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Delivery</h3>
          <p className="text-muted-foreground leading-relaxed">
            Hosts can optionally offer delivery for their item, either free of
            charge or for a fee. Delivery fees are negotiated between the host
            and the renter through Chats. {COMPANY_NAME} does not take delivery
            fee payment. Delivery fees may qualify as deductible expenses for tax
            purposes.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Tipping</h3>
          <p className="text-muted-foreground leading-relaxed">
            Did you have a positive experience with your host? Were they
            especially helpful, accommodating, or attentive to your specific
            needs? After your rental is complete, you have the option to leave a
            tip as a way to show your appreciation. Hosts receive 100% of any
            tips provided.
            <span style={{ fontWeight: 700 }}>
              {" "}
              Listing items at artificially low prices or soliciting tips to
              circumvent {COMPANY_NAME}’s payment system is prohibited and will
              result in removal from the platform.
            </span>
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Payment Processing</h3>
          <p className="text-muted-foreground leading-relaxed">
            All payments are processed securely through Stripe. Payments can be
            made using credit or debit cards.
          </p>
        </div>
        {/*}
        <div>
          <h3 className="text-lg font-medium mb-2">Security Deposits</h3>
          <p className="text-muted-foreground leading-relaxed">
            Item owners may require a refundable security deposit to cover
            potential damages. This deposit will be refunded within 7 business
            days after the item is returned in its original condition.
          </p>
        </div>*/}
      </div>
    </section>

    <Separator />

    {/* Safety and Security */}
    <section id="safety-security">
      <h2 className="text-2xl font-semibold mb-4">
        Safety and Security Requirements
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Meeting Guidelines</h3>
          <p className="text-muted-foreground leading-relaxed">
            For your safety, always meet in well-lit, public locations such as
            active parking lots, public libraries, or outside police stations.
            Avoid meeting at night or in private locations unless it is
            absolutely necessary to do so. Do not bring additional people unless
            it is agreed upon by all parties.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Identity Verification</h3>
          <p className="text-muted-foreground leading-relaxed">
            We may require identity verification for certain high-value items or
            users. This helps maintain trust and safety within our community.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Privacy Protection</h3>
          <p className="text-muted-foreground leading-relaxed">
            Do not share personal information such as your full address, phone
            number, or financial details through our messaging system. Keep
            communications relevant to the rental transaction.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Prohibited Items */}
    <section id="prohibited-items">
      <h2 className="text-2xl font-semibold mb-4">
        Prohibited Items and Activities
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Prohibited Items</h3>
          <p className="text-muted-foreground leading-relaxed mb-2">
            The following is a non-exhaustive list of prohibited items:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Firearms and ammunition</li>
            <li>Illegal drugs and controlled substances</li>
            <li>Stolen, counterfeit, or unauthorized items</li>
            <li>Vehicles requiring registration</li>
            <li>Items requiring special licenses</li>
            <li>Hazardous materials and chemicals</li>
            <li>Live animals or plants</li>
            <li>Obscene materials</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">
            Prohibited Services and Activities
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Users may not use the platform for fraudulent or unlawful
            activities, harassment, spam, or any illegal purposes. Violation of
            these terms may result in immediate account suspension or deletion.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Damage and Insurance */}
    <section id="damage-insurance">
      <h2 className="text-2xl font-semibold mb-4">
        Damage, Loss, and Insurance Policies
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Renter Responsibility</h3>
          <p className="text-muted-foreground leading-relaxed">
            As a renter, you are responsible for returning items in the same
            condition you received them, with the exception of reasonable wear
            and tear.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Damage Assessment</h3>
          <p className="text-muted-foreground leading-relaxed">
            If an item is damaged, the owner must provide evidence of the damage
            and a reasonable repair estimate. This is best resolved by
            photographing the item immediately before and after the item is
            given to and received from the renter.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Insurance Coverage</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our long-term vision at {COMPANY_NAME} is to provide comprehensive
            insurance for every rental. As we are still in the early stages, we
            can only provide basic insurance. We are working diligently to
            secure the necessary funding to make comprehensive coverage
            possible. We appreciate your patience and understanding as we work
            towards this goal.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Claim Resolution</h3>
          <p className="text-muted-foreground leading-relaxed">
            All insurance claims are subject to review and may be denied in
            cases of fraud, misrepresentation, negligence, prohibited item
            listings, or violations of platform policies. Claims may also be
            denied if documentation of loss or damage is insufficient.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Dispute Resolution */}
    <section id="dispute-resolution">
      <h2 className="text-2xl font-semibold mb-4">
        Dispute Resolution and Support
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Resolution Process</h3>
          <p className="text-muted-foreground leading-relaxed">
            If disputes arise between users, {COMPANY_NAME} will facilitate
            communication and mediation. Our support team will review evidence
            from both parties and make fair determinations based on our
            policies.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Reporting Issues</h3>
          <p className="text-muted-foreground leading-relaxed">
            Users must report issues within 48 hours of the incident occurrence.
            Late reporting may limit our ability to investigate and resolve
            disputes effectively.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Privacy and Data */}
    <section id="privacy-data">
      <h2 className="text-2xl font-semibold mb-4">Privacy and Data Usage</h2>
      <p className="text-muted-foreground leading-relaxed">
        Your privacy is important to us. We collect, use, and protect your
        personal information in accordance with our Privacy Policy. By using
        {COMPANY_NAME}, you consent to the collection and use of your
        information as described in our Privacy Policy which is incorporated
        into these Terms of Service by reference.
      </p>
    </section>

    <Separator />

    {/* Account Termination */}
    <section id="account-termination">
      <h2 className="text-2xl font-semibold mb-4">Account Termination</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Voluntary Termination</h3>
          <p className="text-muted-foreground leading-relaxed">
            You may delete your account at any time, but you remain responsible
            for any outstanding rental agreements and obligations.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Involuntary Termination</h3>
          <p className="text-muted-foreground leading-relaxed">
            We may suspend or terminate accounts that violate these Terms of
            Service, engage in fraudulent activity, or pose risks to the
            community.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Legal Disclaimers */}
    <section id="legal-disclaimers">
      <h2 className="text-2xl font-semibold mb-4">
        Legal Disclaimers and Limitations
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Platform Liability</h3>
          <p className="text-muted-foreground leading-relaxed">
            {COMPANY_NAME} acts solely as an intermediary platform. We are not
            responsible for the quality, safety, legality, or availability of
            items listed by users, nor are we responsible for the actions or
            inactions of users.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Limitation of Liability</h3>
          <p className="text-muted-foreground leading-relaxed">
            To the fullest extent permitted by law, {COMPANY_NAME}'s liability
            for any claims related to the use of our platform is limited to the
            amount of fees paid to us in connection with the specific
            transaction giving rise to the claim.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Governing Law</h3>
          <p className="text-muted-foreground leading-relaxed">
            These Terms of Service are governed by the laws of the jurisdiction
            in which {COMPANY_NAME} operates, without regard to conflict of law
            principles.
          </p>
        </div>
      </div>
    </section>

    <Separator />

    {/* Changes to Terms */}
    <section id="changes-to-terms">
      <h2 className="text-2xl font-semibold mb-4">
        Changes to Terms of Service
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        We may modify these Terms of Service from time to time. When we make
        changes, we will notify users via email or through prominent notices on
        our platform. Your continued use of {COMPANY_NAME} after such
        modifications constitutes acceptance of the updated terms.
      </p>
    </section>

    <Separator />

    {/* Contact Information */}
    <section id="contact-information">
      <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
      <p className="text-muted-foreground leading-relaxed">
        If you have questions about these Terms of Service, please contact our
        support team at{" "}
        <a
          href={`mailto:${COMPANY_EMAIL}`}
          className="text-primary hover:underline"
        >
          {COMPANY_EMAIL}
        </a>{" "}
        or through our support chat found in your messages.
      </p>
    </section>

    <Separator />

    <div className="text-center pt-8">
      <p className="text-sm text-muted-foreground">
        By using {COMPANY_NAME}, you acknowledge that you have read, understood,
        and agree to be bound by these Terms of Service.
      </p>
    </div>
  </>
);
