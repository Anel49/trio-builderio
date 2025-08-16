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

declare global {
  interface Window {
    google: any;
    paypal: any;
    ApplePaySession: any;
  }
}

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Form states
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
    zip: "",
  });

  // Mock booking data (would come from route params/state)
  const booking = {
    item: "Professional Riding Lawn Mower",
    host: "Sarah Martinez",
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

  // Re-initialize PayPal when payment method changes
  useEffect(() => {
    if (paymentMethod === 'paypal') {
      initializePaymentProviders();
    }
  }, [paymentMethod]);

  const initializePaymentProviders = async () => {
    // Google Pay initialization
    if (window.google && window.google.payments) {
      // Google Pay is available
    }

    // PayPal initialization
    if (window.PayPal) {
      window.PayPal.Buttons({
        createOrder: createPayPalOrder,
        onApprove: handlePayPalApprove,
      }).render("#paypal-button-container");
    }
  };

  // Payment handlers
  const handleGooglePay = async () => {
    setIsProcessing(true);
    try {
      const paymentRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA"],
            },
          },
        ],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: booking.total.toString(),
          currencyCode: "USD",
        },
      };

      // Mock Google Pay API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setOrderComplete(true);
    } catch (error) {
      console.error("Google Pay error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplePay = async () => {
    setIsProcessing(true);
    try {
      if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        const session = new ApplePaySession(3, {
          countryCode: "US",
          currencyCode: "USD",
          supportedNetworks: ["visa", "masterCard", "amex"],
          merchantCapabilities: ["supports3DS"],
          total: {
            label: "Trio Rental",
            amount: booking.total.toString(),
          },
        });

        session.begin();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setOrderComplete(true);
      }
    } catch (error) {
      console.error("Apple Pay error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const createPayPalOrder = () => {
    return fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: booking.total,
        currency: "USD",
      }),
    })
      .then((res) => res.json())
      .then((data) => data.orderID);
  };

  const handlePayPalApprove = async (data: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      if (response.ok) {
        setOrderComplete(true);
      }
    } catch (error) {
      console.error("PayPal error:", error);
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
          <div className="lg:col-span-1 order-2 lg:order-1">
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
          <div className="lg:col-span-2 order-1 lg:order-2">
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
                  {/* Google Pay */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="google-pay" id="google-pay" />
                    <Label
                      htmlFor="google-pay"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            G
                          </span>
                        </div>
                        <span>Google Pay</span>
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
                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                          <span className="text-white text-xs">🍎</span>
                        </div>
                        <span>Apple Pay</span>
                      </div>
                    </Label>
                  </div>

                  {/* PayPal */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            P
                          </span>
                        </div>
                        <span>PayPal</span>
                      </div>
                    </Label>
                  </div>

                  {/* Credit/Debit Card */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-gray-600" />
                        <span>Credit or Debit Card</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Card Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        placeholder="Card number"
                        value={cardForm.number}
                        onChange={(e) =>
                          setCardForm({ ...cardForm, number: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onChange={(e) =>
                            setCardForm({ ...cardForm, expiry: e.target.value })
                          }
                        />
                        <Input
                          placeholder="CVC"
                          value={cardForm.cvc}
                          onChange={(e) =>
                            setCardForm({ ...cardForm, cvc: e.target.value })
                          }
                        />
                      </div>
                      <Input
                        placeholder="Cardholder name"
                        value={cardForm.name}
                        onChange={(e) =>
                          setCardForm({ ...cardForm, name: e.target.value })
                        }
                      />
                      <Input
                        placeholder="ZIP code"
                        value={cardForm.zip}
                        onChange={(e) =>
                          setCardForm({ ...cardForm, zip: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* PayPal Container */}
                {paymentMethod === "paypal" && (
                  <div id="paypal-button-container" className="p-4"></div>
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
                    }
                  }}
                  disabled={isProcessing || paymentMethod === "paypal"}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? "Processing..." : `Pay $${booking.total}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
