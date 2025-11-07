import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  HelpCircle,
  User,
  ShoppingBag,
  Home,
  ChevronDown,
} from "lucide-react";
import { COMPANY_NAME } from "@/lib/constants";

type FAQSection = "general" | "account" | "renter" | "host";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [selectedSection, setSelectedSection] = useState<FAQSection>("general");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const sections = [
    {
      id: "general" as FAQSection,
      title: "General FAQs",
      icon: HelpCircle,
      description: "Learn about our platform basics",
    },
    {
      id: "account" as FAQSection,
      title: "Account FAQs",
      icon: User,
      description: "Account management and settings",
    },
    {
      id: "renter" as FAQSection,
      title: "Renter FAQs",
      icon: ShoppingBag,
      description: "Renting items on our platform",
    },
    {
      id: "host" as FAQSection,
      title: "Host FAQs",
      icon: Home,
      description: "Listing and hosting items",
    },
  ];

  const generalFAQs: FAQItem[] = [
    {
      question: "What is this platform?",
      answer:
        `${COMPANY_NAME} is a peer-to-peer rental marketplace where individuals can rent everyday items from one another, including but not limited to tools, clothing, electronics, sports gear, and event supplies.`,
    },
    {
      question: "How does it work?",
      answer:
        "Owners (hosts) publicly list items of theirs they're willing to rent. Renters browse listings, book items for available dates, arrange pickup or delivery via messages, and then return it once the rental period ends.",
    },
    {
      question: "Who can use the platform?",
      answer:
        "Anyone who meets our age and verification requirements and abides by our platform's Terms of Service can use our platform.",
    },
    {
      question: "Do I need an account to host or rent?",
      answer:
        "Yes, you need an account to host or rent items. This helps us verify individuals to ensure our users and their items are cared for.",
    },
    {
      question: "How are users verified?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      question: "Are items insured?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      question: "Do you offer delivery?",
      answer:
        `${COMPANY_NAME} does not offer delivery—yet. However, hosts can advertise that they will deliver to you. Look for listings marked with "Offers delivery" or "Offers free delivery". Delivery instructions and fees will be decided in the Chat between the host and renter.`,
    },
    {
      question: "How do pickups and drop-offs work?",
      answer:
        "Users must coordinate with each other to arrange a meeting location or delivery address and fee.",
    },
    {
      question: "How do reviews work?",
      answer:
        "Renters can leave a review for both the host and the listing on their respective pages. Hosts can leave a review for the renter on their profile page.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      question: "Is my payment information secure?",
      answer:
        "Yes, we use Stripe as our payment processor. Stripe has served many iconic brands including Amazon, Google, Pepsi, LG, Toyota, Turo, Lyft, Shopify, Instacart, and many more.",
    },
    {
      question: "Do you hold deposits?",
      answer:
        "Yes. Deposits are held and returned after successful item return and inspection.",
    },
  ];

  const accountFAQs: FAQItem[] = [
    {
      question: "How do I change my password or email?",
      answer:
        "Users can change either their password or email through the cog icon found on your profile page.",
    },
    {
      question: "How do I delete my account?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
  ];

  const renterFAQs: FAQItem[] = [
    {
      question: "How do I rent an item?",
      answer: `1. Create an account\n2. Search for listings using keywords and filters\n3. Choose an item, select from available dates, and submit your request\n4. Coordinate pickup or delivery through messages with host`,
    },
    {
      question: "Can I extend my booking?",
      answer:
        'Yes! If you want to extend your booking, go to your Order History, find the booking, click or tap the "Extend Booking" button, and if the owner approves the extension, you will be notified to make a payment. Once the payment is accepted, your booking\'s end date will be updated.',
    },
    {
      question: "Can I cancel my booking?",
      answer:
        "Yes, both renters and hosts can cancel bookings. Hosts can set a mandatory cancellation fee during listing creation. This fee is charged if the booking is cancelled within 24 hours of it beginning.",
    },
    {
      question: "Is a deposit required?",
      answer: "Listings may include a security deposit if set by the host.",
    },
    {
      question: "What happens if I'm late returning an item?",
      answer: "Late fees may apply based on the listing's terms.",
    },
    {
      question: "What if the item is damaged while I'm renting it?",
      answer:
        "As a renter, you have the responsibility to document, through pictures and notes, any damage that occurred to an item during your rental period and, if applicable, its transport to the host. At the end of the rental period, which can be ended prematurely if both parties agree, submit a claim with us and provide us with the information gathered to resolve the claim.",
    },
    {
      question: "What if I have an issue with the host?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
  ];

  const hostFAQs: FAQItem[] = [
    {
      question: "What items are prohibited?",
      answer:
        `Prohibited include, but are not limited to, firearms, ammunition, drugs, live animals, obscene materials, and anything restricted by law. Full categorization of prohibited items can be found under "Prohibited Items and Activities" in our Terms of Service page. Listings of items categorized under these categories will be removed and may result in account suspension or deletion at the discretion of a ${COMPANY_NAME} staff member.`,
    },
    {
      question: "How do I list an item?",
      answer: `1. Create an account\n2. Select \"Rent your product\" from the navigation bar or \"List an item\" from the profile page\n3. Populate mandatory fields (title, location, price, description; optional tags)\n4. Post the listing`,
    },
    {
      question: "Can I cancel a booking?",
      answer:
        "Yes, both renters and hosts can cancel bookings. Hosts can set a mandatory cancellation fee during listing creation. This fee is charged if the booking is cancelled within 24 hours of it beginning.",
    },
    {
      question: "Can I require a deposit for my item?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      question: "How do I get paid?",
      answer:
        "Payments are wired to your connected bank account two days after the rental is marked completed.",
    },
    {
      question: "What if someone loses or doesn't return my item?",
      answer:
        `We have a comprehensive claim process that holds renters liable for not returning an item. It is up to the host's discretion whether they want to initiate a claim. If ${COMPANY_NAME} or the host fail to retrieve the missing item featured in a claim, ${COMPANY_NAME} will reimburse the host a dollar amount equal to the item's condition at the time of lending it, capped at $5,000.`,
    },
    {
      question: "What if my item gets damaged?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      question: "What if I have an issue with the renter?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
  ];

  const getFAQs = () => {
    switch (selectedSection) {
      case "account":
        return accountFAQs;
      case "renter":
        return renterFAQs;
      case "host":
        return hostFAQs;
      case "general":
      default:
        return generalFAQs;
    }
  };

  const toggleExpanded = (question: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(question)) {
      newExpanded.delete(question);
    } else {
      newExpanded.add(question);
    }
    setExpandedItems(newExpanded);
  };

  const currentSection = sections.find((s) => s.id === selectedSection);
  const faqs = getFAQs();

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
          {/* FAQ Section Selector - Top on Mobile, Right on Desktop */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="text-lg">Help Center</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a category
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setSelectedSection(section.id);
                        setExpandedItems(new Set());
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent
                          className={`h-5 w-5 mt-0.5 ${
                            selectedSection === section.id
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {section.title}
                          </h4>
                          <p
                            className={`text-xs mt-1 ${
                              selectedSection === section.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {section.description}
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
                  {currentSection?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-8">
                {faqs.map((faq, index) => {
                  const itemId = `${selectedSection}-${index}`;
                  const isExpanded = expandedItems.has(itemId);

                  return (
                    <div
                      key={itemId}
                      className="border border-border rounded-lg"
                    >
                      <button
                        onClick={() => toggleExpanded(itemId)}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <h3 className="font-semibold text-left text-foreground">
                          {faq.question}
                        </h3>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground flex-shrink-0 ml-4 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <>
                          <Separator />
                          <div className="px-4 py-4 text-muted-foreground whitespace-pre-line">
                            {faq.answer.includes("\n") ? (
                              <ol className="list-decimal list-inside space-y-2">
                                {faq.answer.split("\n").map((line, i) => (
                                  <li key={i}>
                                    {line.replace(/^\d+\.\s*/, "")}
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p>{faq.answer}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
