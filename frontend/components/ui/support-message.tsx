import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleNumberClick = (
    numberText: string,
    prefix: "ORD" | "REQ" | "EXT",
  ) => {
    const tab = prefix === "ORD" ? "orders" : "requests";
    navigate(
      `/rentals-and-requests?tab=${tab}&search=${encodeURIComponent(numberText)}`,
    );
  };

  // Parse order/request numbers
  const orderPattern = /(ORD|REQ|EXT)-[\w]+/g;
  const orderMatches: Array<{
    text: string;
    index: number;
    prefix: "ORD" | "REQ" | "EXT";
  }> = [];
  let match;

  while ((match = orderPattern.exec(text)) !== null) {
    orderMatches.push({
      text: match[0],
      index: match.index,
      prefix: match[1] as "ORD" | "REQ" | "EXT",
    });
  }

  // Parse support message labels (only for support user ID 2)
  const isSupportMessage = senderId === 2;
  const labels = [
    "Listing:",
    "Claim type:",
    "Incident date:",
    "Claim details:",
  ];
  const labelMatches: Array<{ text: string; index: number }> = [];

  if (isSupportMessage) {
    const labelPattern = new RegExp(
      `(${labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "g",
    );

    while ((match = labelPattern.exec(text)) !== null) {
      labelMatches.push({
        text: match[0],
        index: match.index,
      });
    }
  }

  // Merge and sort all matches by index
  const allMatches = [
    ...orderMatches.map((m) => ({ ...m, type: "order" as const })),
    ...labelMatches.map((m) => ({ ...m, type: "label" as const })),
  ].sort((a, b) => a.index - b.index);

  // If no matches, return text as-is
  if (allMatches.length === 0) {
    return <>{text}</>;
  }

  // Build elements by interleaving text and styled spans
  const elements: Array<string | React.ReactNode> = [];
  let lastIndex = 0;

  for (const m of allMatches) {
    // Add text before this match
    if (m.index > lastIndex) {
      elements.push(text.slice(lastIndex, m.index));
    }

    // Add the styled element
    if (m.type === "order") {
      const orderMatch = m as (typeof orderMatches)[0] & { type: "order" };
      elements.push(
        <button
          key={`order-${m.index}`}
          onClick={() => handleNumberClick(orderMatch.text, orderMatch.prefix)}
          className={
            isCurrentUser
              ? "text-white font-bold hover:underline cursor-pointer transition-colors inline"
              : "text-primary font-bold hover:underline cursor-pointer transition-colors inline"
          }
        >
          {orderMatch.text}
        </button>,
      );
    } else {
      elements.push(
        <strong key={`label-${m.index}`} className="font-bold">
          {m.text}
        </strong>,
      );
    }

    lastIndex = m.index + m.text.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
}
