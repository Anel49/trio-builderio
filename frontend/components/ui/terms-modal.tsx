import { LegalModal, TermsContent } from "./legal-modal";

interface TermsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ isOpen, onOpenChange }: TermsModalProps) {
  return (
    <LegalModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Terms of Service"
      description="Last updated: December 15, 2024"
    >
      <TermsContent />
    </LegalModal>
  );
}
