import { LegalModal, PrivacyContent } from "./legal-modal";

interface PrivacyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ isOpen, onOpenChange }: PrivacyModalProps) {
  return (
    <LegalModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Privacy Policy"
      description="Last updated: December 15, 2024"
    >
      <PrivacyContent />
    </LegalModal>
  );
}
