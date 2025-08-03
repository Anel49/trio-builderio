import { LegalModal, CookiesContent } from "./legal-modal";

interface CookiesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiesModal({ isOpen, onOpenChange }: CookiesModalProps) {
  return (
    <LegalModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Cookie Policy"
      description="Last updated: December 15, 2024"
    >
      <CookiesContent />
    </LegalModal>
  );
}
