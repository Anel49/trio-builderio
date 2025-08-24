import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import {
  Calendar,
  CreditCard,
  Shield,
  CheckCircle,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { currentUser } from "@/lib/user-profile";

declare global {
  interface Window {
    google: any;
    paypal: any;
    ApplePaySession: any;
  }
}

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Form states

  // Mock booking data (would come from route params/state)
  const booking = {
    item: "Professional Riding Lawn Mower",
    host: currentUser.name,
    startDate: "Dec 25, 2024",
    endDate: "Dec 27, 2024",
    days: 3,
    dailyRate: 45,
    subtotal: 135,
    serviceFee: 20,
    taxes: 12,
    total: 167,
    image:
      "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=300&h=200&fit=crop&auto=format",
  };

  // Initialize payment providers
  useEffect(() => {
    initializePaymentProviders();
  }, []);

  // Initialize PayPal when payment method changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (paymentMethod === "paypal") {
      timeoutId = setTimeout(() => {
        const paypalContainer = document.getElementById(
          "paypal-button-container",
        );

        if (
          window.paypal &&
          paypalContainer &&
          !paypalContainer.hasChildNodes()
        ) {
          window.paypal
            .Buttons({
              createOrder: createPayPalOrder,
              onApprove: handlePayPalApprove,
              onCancel: () => {
                console.log("PayPal payment cancelled");
                setIsProcessing(false);
              },
              onError: (err: any) => {
                console.error("PayPal SDK error:", err);
                setIsProcessing(false);
                alert("PayPal encountered an error. Please try again.");
              },
            })
            .render("#paypal-button-container")
            .catch((err: any) => {
              console.error("PayPal render error:", err);
            });
        }
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Clean up PayPal buttons when component unmounts or payment method changes
      const paypalContainer = document.getElementById(
        "paypal-button-container",
      );
      if (paypalContainer) {
        paypalContainer.innerHTML = "";
      }
    };
  }, [paymentMethod]);

  const initializePaymentProviders = async () => {
    // This function is now only used for other payment providers
  };

  // Payment handlers
  const handleGooglePay = async () => {
    setIsProcessing(true);
    try {
      if (!window.google || !window.google.payments) {
        throw new Error("Google Pay not available");
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: "TEST", // Change to 'PRODUCTION' for live
      });

      // First check if Google Pay is available
      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX", "DISCOVER"],
            },
          },
        ],
      };

      const readyToPay = await paymentsClient.isReadyToPay(isReadyToPayRequest);

      if (readyToPay.result) {
        const paymentDataRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX", "DISCOVER"],
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                  gateway: "example", // Replace with your payment processor
                  gatewayMerchantId: "exampleGatewayMerchantId",
                },
              },
            },
          ],
          transactionInfo: {
            totalPriceStatus: "FINAL",
            totalPrice: booking.total.toString(),
            currencyCode: "USD",
            countryCode: "US",
          },
          merchantInfo: {
            merchantId: "12345678901234567890", // Replace with your merchant ID
            merchantName: "Trio Rental Marketplace",
          },
        };

        const paymentData =
          await paymentsClient.loadPaymentData(paymentDataRequest);

        console.log("Google Pay payment data:", paymentData);

        // For demo purposes, complete the order
        // In production, you would process this with your backend
        setOrderComplete(true);
      } else {
        throw new Error("Google Pay not available for this user");
      }
    } catch (error: any) {
      console.error("Google Pay error:", error);

      let errorMessage =
        "Google Pay payment failed. Please try another method.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.statusCode) {
        switch (error.statusCode) {
          case "CANCELED":
            console.log("Google Pay cancelled by user");
            setIsProcessing(false);
            return; // Don't show error for user cancellation
          case "DEVELOPER_ERROR":
            errorMessage =
              "Google Pay configuration error. Please contact support.";
            break;
          default:
            errorMessage = `Google Pay error: ${error.statusCode}`;
        }
      }

      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplePay = async () => {
    setIsProcessing(true);
    try {
      if (!window.ApplePaySession) {
        console.log("Apple Pay not supported - not on Safari/iOS");
        alert(
          "Apple Pay is only available on Safari browsers on iOS and macOS devices.",
        );
        setIsProcessing(false);
        return;
      }

      if (!window.ApplePaySession.canMakePayments()) {
        console.log("Apple Pay not available - no cards configured");
        alert(
          "Apple Pay is not set up on this device. Please add a card to your Apple Wallet or use another payment method.",
        );
        setIsProcessing(false);
        return;
      }

      const request = {
        countryCode: "US",
        currencyCode: "USD",
        supportedNetworks: ["visa", "masterCard", "amex", "discover"],
        merchantCapabilities: ["supports3DS"],
        total: {
          label: "Trio Rental",
          amount: booking.total.toString(),
          type: "final",
        },
        lineItems: [
          {
            label: booking.item,
            amount: booking.subtotal.toString(),
          },
          {
            label: "Service Fee",
            amount: booking.serviceFee.toString(),
          },
          {
            label: "Taxes",
            amount: booking.taxes.toString(),
          },
        ],
      };

      const session = new window.ApplePaySession(3, request);

      session.onvalidatemerchant = async (event: any) => {
        try {
          // For demo purposes, create a mock merchant session
          // In production, you would validate with your backend
          console.log(
            "Apple Pay merchant validation required:",
            event.validationURL,
          );

          // Mock merchant session - this will fail but show the flow
          const mockMerchantSession = {
            epochTimestamp: Date.now(),
            expiresAt: Date.now() + 300000,
            merchantSessionIdentifier: "mock_session_id",
            nonce: "mock_nonce",
            merchantIdentifier: "merchant.com.trio.rental",
            domainName: window.location.hostname,
            displayName: "Trio Rental Marketplace",
          };

          session.completeMerchantValidation(mockMerchantSession);
        } catch (error) {
          console.error("Merchant validation failed:", error);
          session.abort();
        }
      };

      session.onpaymentauthorized = async (event: any) => {
        try {
          console.log("Apple Pay payment authorized:", event.payment);

          // For demo purposes, complete the payment
          // In production, you would process this with your backend
          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          setOrderComplete(true);
        } catch (error) {
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          throw error;
        }
      };

      session.oncancel = () => {
        console.log("Apple Pay cancelled by user");
        setIsProcessing(false);
      };

      session.begin();
    } catch (error) {
      console.error("Apple Pay error:", error);
      alert("Apple Pay is not available. Please try another payment method.");
      setIsProcessing(false);
    }
  };

  const createPayPalOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: booking.total.toString(),
          },
          description: `Rental: ${booking.item} (${booking.startDate} - ${booking.endDate})`,
        },
      ],
      application_context: {
        brand_name: "Trio Rental Marketplace",
        locale: "en-US",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    });
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      // Capture the order directly with PayPal SDK
      const details = await actions.order.capture();

      console.log("PayPal payment completed:", details);

      // For demo purposes, complete the order
      // In production, you would verify this with your backend
      if (details.status === "COMPLETED") {
        setOrderComplete(true);
      } else {
        throw new Error("Payment not completed");
      }
    } catch (error) {
      console.error("PayPal error:", error);
      alert("PayPal payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    try {
      // Mock Stripe API call
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: booking.total * 100, // Stripe uses cents
          currency: "usd",
          card: cardForm,
        }),
      });

      if (response.ok) {
        setOrderComplete(true);
      }
    } catch (error) {
      console.error("Card payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Your reservation for {booking.item} has been confirmed.
            </p>
            <Button
              onClick={() => (window.location.href = "/profile")}
              className="w-full"
            >
              View My Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <div className="lg:col-span-1 order-1 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-3">
                  <img
                    src={booking.image}
                    alt={booking.item}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{booking.item}</h3>
                    <p className="text-sm text-muted-foreground">
                      Hosted by {booking.host}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {booking.startDate} - {booking.endDate}
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    2.3 miles away
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      ${booking.dailyRate} × {booking.days} days
                    </span>
                    <span>${booking.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>${booking.serviceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>${booking.taxes}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${booking.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-2 order-2 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred payment method
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* PayPal */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="#0070ba"
                          >
                            <path d="M37.972 13.82c.107-5.565-4.485-9.837-10.799-9.837H14.115a1.278 1.278 0 0 0-1.262 1.079L7.62 37.758a1.038 1.038 0 0 0 1.025 1.2h7.737l-1.21 7.572a1.038 1.038 0 0 0 1.026 1.2H22.5c.305 0 .576-.11.807-.307.231-.198.269-.471.316-.772l1.85-10.885c.047-.3.2-.69.432-.888.231-.198.433-.306.737-.307H30.5c6.183 0 11.43-4.394 12.389-10.507.678-4.34-1.182-8.287-4.916-10.244Z" />

                            <path d="m18.056 26.9-1.927 12.22-1.21 7.664a1.038 1.038 0 0 0 1.026 1.2h6.67a1.278 1.278 0 0 0 1.261-1.079l1.758-11.14a1.277 1.277 0 0 1 1.261-1.078h3.927c6.183 0 11.429-4.51 12.388-10.623.68-4.339-1.504-8.286-5.238-10.244-.01.462-.05.923-.121 1.38-.959 6.112-6.206 10.623-12.389 10.623h-6.145a1.277 1.277 0 0 0-1.261 1.077Z" />

                            <path d="M16.128 39.12h-7.76a1.037 1.037 0 0 1-1.025-1.2l5.232-33.182a1.277 1.277 0 0 1 1.262-1.078h13.337c6.313 0 10.905 4.595 10.798 10.16-1.571-.824-3.417-1.295-5.44-1.295H21.413a1.278 1.278 0 0 0-1.261 1.078L18.057 26.9l-1.93 12.22Z" />
                          </svg>
                          <span>PayPal</span>
                        </div>
                      </Label>
                    </div>

                    {/* Apple Pay */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="apple-pay" id="apple-pay" />
                      <Label
                        htmlFor="apple-pay"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                          <span>Apple Pay</span>
                        </div>
                      </Label>
                    </div>

                    {/* Google Pay */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="google-pay" id="google-pay" />
                      <Label
                        htmlFor="google-pay"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span>Google Pay</span>
                        </div>
                      </Label>
                    </div>

                    {/* Venmo */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="venmo" id="venmo" />
                      <Label htmlFor="venmo" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              V
                            </span>
                          </div>
                          <span>Venmo</span>
                        </div>
                      </Label>
                    </div>

                    {/* Cash App */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cash-app" id="cash-app" />
                      <Label
                        htmlFor="cash-app"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              $
                            </span>
                          </div>
                          <span>Cash App</span>
                        </div>
                      </Label>
                    </div>

                    {/* Zelle */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="zelle" id="zelle" />
                      <Label htmlFor="zelle" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              Z
                            </span>
                          </div>
                          <span>Zelle</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* PayPal Container */}
                {paymentMethod === "paypal" && (
                  <div
                    key="paypal-container"
                    id="paypal-button-container"
                    className="p-4"
                  ></div>
                )}

                {/* Security Badge */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={() => {
                    switch (paymentMethod) {
                      case "google-pay":
                        handleGooglePay();
                        break;
                      case "apple-pay":
                        handleApplePay();
                        break;
                      case "card":
                        handleCardPayment();
                        break;
                      case "paypal":
                        // PayPal handles its own button clicks
                        console.log("PayPal should use its own buttons");
                        break;
                    }
                  }}
                  disabled={isProcessing || paymentMethod === "paypal"}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing
                    ? "Processing..."
                    : paymentMethod === "google-pay"
                      ? "Pay with Google Pay"
                      : paymentMethod === "apple-pay"
                        ? "Pay with Apple Pay"
                        : paymentMethod === "paypal"
                          ? "Use PayPal Button Above"
                          : `Pay $${booking.total}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
