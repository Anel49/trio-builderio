import { useNavigate } from "react-router-dom";

interface LinkifiedMessageProps {
  text: string;
}

export function LinkifiedMessage({ text }: LinkifiedMessageProps) {
  const navigate = useNavigate();

  const handleNumberClick = (
    numberText: string,
    prefix: "ORD" | "REQ" | "EXT"
  ) => {
    const tab = prefix === "ORD" ? "orders" : "requests";
    navigate(`/rentals-and-requests?tab=${tab}&search=${encodeURIComponent(numberText)}`);
  };

  // Find all matches with their positions
  const pattern = /(ORD|REQ|EXT)-[\w]+/g;
  const matches: Array<{ text: string; index: number; prefix: "ORD" | "REQ" | "EXT" }> = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      text: match[0],
      index: match.index,
      prefix: match[1] as "ORD" | "REQ" | "EXT",
    });
  }

  if (matches.length === 0) {
    return <>{text}</>;
  }

  // Build elements by interleaving text and links
  const elements = [];
  let lastIndex = 0;

  for (const match of matches) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    // Add the link
    elements.push(
      <button
        key={`link-${match.index}`}
        onClick={() => handleNumberClick(match.text, match.prefix)}
        className="text-primary hover:underline cursor-pointer font-medium transition-colors inline"
      >
        {match.text}
      </button>
    );

    lastIndex = match.index + match.text.length;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
}
