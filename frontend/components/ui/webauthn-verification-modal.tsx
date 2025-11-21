import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

interface WebAuthnVerificationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  action: "change_username" | "change_email";
}

export function WebAuthnVerificationModal({
  isOpen,
  onOpenChange,
  onSuccess,
  action,
}: WebAuthnVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setError(
          "WebAuthn is not supported on this device. Please use a device with biometric or PIN authentication.",
        );
        return;
      }

      // Initiate WebAuthn verification
      const response = await apiFetch("/users/webauthn/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        const errorMsg = data.error || "WebAuthn verification failed";
        setError(errorMsg);
        return;
      }

      // Call the authenticate method
      if (data.challenge && data.timeout) {
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(data.challenge),
            timeout: data.timeout,
            userVerification: "preferred",
          },
        });

        if (!assertion) {
          setError("WebAuthn verification was cancelled.");
          return;
        }

        // Send the assertion back to the server for verification
        const verifyResponse = await apiFetch(
          "/users/webauthn/verify-assertion",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              id: assertion.id,
              rawId: Array.from(new Uint8Array(assertion.rawId)),
              type: assertion.type,
              response: {
                clientDataJSON: Array.from(
                  new Uint8Array(assertion.response.clientDataJSON),
                ),
                authenticatorData: Array.from(
                  new Uint8Array(assertion.response.authenticatorData),
                ),
                signature: Array.from(
                  new Uint8Array(assertion.response.signature),
                ),
                userHandle: assertion.response.userHandle
                  ? Array.from(new Uint8Array(assertion.response.userHandle))
                  : null,
              },
              action,
            }),
          },
        );

        const verifyData = await verifyResponse.json().catch(() => ({}));

        if (verifyResponse.ok && verifyData.ok) {
          onSuccess();
          handleClose();
        } else {
          setError(verifyData.error || "Verification failed");
        }
      }
    } catch (err: any) {
      console.error("WebAuthn verification error:", err);
      if (err.name === "NotAllowedError") {
        setError("WebAuthn verification was cancelled.");
      } else if (err.name === "InvalidStateError") {
        setError("This device is not registered. Please contact support.");
      } else {
        setError("An error occurred during verification. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onOpenChange(false);
  };

  const actionLabel =
    action === "change_username" ? "change your username" : "change your email";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Your Identity</DialogTitle>
          <DialogDescription>
            To {actionLabel}, please authenticate using your device's biometric
            or PIN.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-900 dark:text-blue-100">
            Your device will prompt you to verify your identity using:
            <ul className="mt-2 ml-4 list-disc">
              <li>Fingerprint</li>
              <li>Face ID</li>
              <li>Device PIN</li>
              <li>Windows Hello</li>
            </ul>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleVerify} disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify with Device"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
