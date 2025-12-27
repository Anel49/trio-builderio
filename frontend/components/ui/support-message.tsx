import { LinkifiedMessage } from "./linkified-message";

interface SupportMessageProps {
  text: string;
  senderId: number;
  isCurrentUser?: boolean;
}

export function SupportMessage({
  text,
  senderId,
  isCurrentUser,
}: SupportMessageProps) {
  // If not from support user (ID 2), use regular linkified message
  if (senderId !== 2) {
    return <LinkifiedMessage text={text} isCurrentUser={isCurrentUser} />;
  }

  // For support messages, parse and bold specific labels
  const labels = ["Listing:", "Claim type:", "Incident date:", "Claim details:"];
  const parts: Array<string | React.ReactNode> = [];
  let lastIndex = 0;

  // Create a regex pattern that matches any of the labels
  const pattern = new RegExp(
    `(${labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );

  let match;
  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      parts.push(textBefore);
    }

    // Add the bolded label
    parts.push(
      <strong key={`label-${match.index}`} className="font-bold">
        {match[0]}
      </strong>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no labels were found, just return the text as-is
  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
}
