import { Card, CardContent } from "./ui/card";
import {
  animations,
  spacing,
  typography,
  combineTokens,
} from "@/lib/design-tokens";

interface CategoryCardProps {
  icon: string;
  name: string;
  count?: string;
}

export function CategoryCard({ icon, name, count }: CategoryCardProps) {
  return (
    <Card
      className={combineTokens(
        "group cursor-pointer",
        animations.combinations.categoryCard,
        "hover:shadow-lg",
      )}
    >
      <CardContent
        className={combineTokens(spacing.padding.card, "text-center")}
      >
        <div
          className={combineTokens(
            typography.size["4xl"],
            spacing.margin.bottomMd,
          )}
        >
          <p>{icon}</p>
        </div>
        <h3
          className={combineTokens(
            typography.weight.semibold,
            typography.size.lg,
            "mb-1",
          )}
        >
          {name}
        </h3>
        {count && (
          <p
            className={combineTokens("text-muted-foreground", typography.size.sm)}
          >
            {count}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
