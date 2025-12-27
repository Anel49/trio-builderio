import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface LinkifiedMessageProps {
  text: string;
}

export function LinkifiedMessage({ text }: LinkifiedMessageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNumberClick = (
    numberText: string,
    prefix: "ORD" | "REQ" | "EXT"
  ) => {
    const tab = prefix === "ORD" ? "orders" : "requests";
    navigate(`/rentals-and-requests?tab=${tab}&search=${encodeURIComponent(numberText)}`);
  };

  // Split text by patterns like ORD-1000000, REQ-1000000, EXT-1000000
  const pattern = /(ORD|REQ|EXT)-[\w]+/g;
  const parts = text.split(pattern);
  const matches = text.match(pattern) || [];

  if (matches.length === 0) {
    return <>{text}</>;
  }

  // Reconstruct with links
  const elements = [];
  let matchIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      elements.push(parts[i]);
    }

    if (matchIndex < matches.length && i < parts.length - 1) {
      const match = matches[matchIndex];
      const prefix = match.split("-")[0] as "ORD" | "REQ" | "EXT";

      elements.push(
        <button
          key={`link-${matchIndex}`}
          onClick={() => handleNumberClick(match, prefix)}
          className="text-primary hover:underline cursor-pointer font-medium transition-colors"
        >
          #{match}
        </button>
      );

      matchIndex++;
    }
  }

  return <>{elements}</>;
}
