import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, MapPin, X as XIcon } from "lucide-react";
import { colors, combineColors } from "@/lib/colors";
import { ENABLE_FAVORITES } from "@/lib/constants";
import {
  animations,
  spacing,
  typography,
  shadows,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  rating: number | null;
  reviews?: number;
  image: string;
  host: string;
  type: string;
  distance: string | null;
  listedTime?: string;
  hideHostInfo?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFavorite?: (name: string, id: number) => void;
  className?: string;
  priceUnitLabel?: string;
  underlinePrice?: boolean;
  onDeleteClick?: () => void;
  delivery?: boolean;
  freeDelivery?: boolean;
  isFavorited?: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  rating,
  reviews,
  image,
  host,
  type,
  distance,
  listedTime,
  hideHostInfo,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFavorite,
  className,
  priceUnitLabel = "per day",
  underlinePrice = false,
  onDeleteClick,
  delivery,
  freeDelivery,
  isFavorited = false,
}: ProductCardProps) {
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const distanceText =
    typeof distance === "string" && distance.trim() ? distance.trim() : null;
  const resolvedDistance = distanceText ?? "Distance unavailable";

  return (
    <Card
      className={combineTokens(
        "group cursor-pointer",
        animations.combinations.productCard,
        shadows.hover.productCard,
        className || "",
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className={combineTokens(
            "w-full object-cover",
            spacing.dimensions.productImage,
          )}
        />
        {ENABLE_FAVORITES && (
          <Button
            size="icon"
            variant="ghost"
            className={combineTokens(
              layouts.absolute.topRight,
              "bg-white/80 hover:bg-white",
              animations.combinations.heartButton,
            )}
            onMouseEnter={() => setIsHeartHovered(true)}
            onMouseLeave={() => setIsHeartHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (onFavorite) {
                onFavorite(name, id);
              }
            }}
          >
            <Heart
              className={combineTokens(
                spacing.dimensions.icon.sm,
                "heart-transition",
              )}
              style={{
                stroke: "#ff6f6f",
                fill: isHeartHovered || isFavorited ? "#ff6f6f" : "transparent",
              }}
            />
          </Button>
        )}
        {onDeleteClick && (
          <Button
            size="icon"
            variant="outline"
            className={combineTokens(
              layouts.absolute.topRight,
              "border-red-300 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600",
              "mr-0 mt-0",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            aria-label="Delete listing"
            title="Delete listing"
          >
            <XIcon className={combineTokens(spacing.dimensions.icon.sm)} />
          </Button>
        )}
        <Badge
          className={combineTokens(
            layouts.absolute.bottomLeft,
            "bg-black/60 text-white",
          )}
        >
          {type}
        </Badge>
      </div>

      <CardContent className={spacing.padding.card}>
        <div
          className={combineTokens(
            "flex justify-between items-start",
            spacing.margin.bottomSm,
          )}
        >
          <div className="flex-1">
            <h3
              className={combineTokens(
                typography.weight.semibold,
                typography.size.xl,
                "leading-tight",
              )}
            >
              {name}
            </h3>
            {listedTime && (
              <p
                className={combineTokens(typography.size.sm, colors.text.muted)}
              >
                Listed {listedTime}
              </p>
            )}
          </div>
          <div className="text-right ml-4">
            <div
              className={combineTokens(
                typography.combinations.price,
                underlinePrice ? "underline" : "",
              )}
            >
              {price}
            </div>
            <div
              className={combineTokens(typography.size.sm, colors.text.muted)}
            >
              {priceUnitLabel}
            </div>
          </div>
        </div>

        <div
          className={combineTokens(
            "flex items-center justify-between",
            typography.size.sm,
            colors.text.muted,
            "mb-3",
            "flex-wrap",
          )}
        >
          <div className={combineTokens(layouts.flex.start, "space-x-4")}>
            <div className={layouts.flex.start}>
              <Star
                className={combineTokens(
                  spacing.dimensions.icon.sm,
                  "mr-1",
                  rating == null ? colors.rating.starEmpty : colors.rating.star,
                )}
              />
              {rating == null ? "Not yet rated" : rating}
            </div>
            {typeof reviews === "number" && reviews > 0 && (
              <div>({reviews} reviews)</div>
            )}
          </div>
          {(delivery || freeDelivery) && (
            <div
              className={combineTokens(
                "flex items-center gap-1",
                freeDelivery
                  ? "text-green-600 dark:text-green-400"
                  : colors.text.muted,
              )}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {freeDelivery ? "Offers free delivery" : "Offers delivery"}
              </span>
            </div>
          )}
        </div>

        {!hideHostInfo ? (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${colors.text.muted}`}>
              Hosted by {host}
            </span>
            <div className={`flex items-center text-sm ${colors.text.muted}`}>
              <MapPin className="h-3 w-3 mr-1" />
              {resolvedDistance}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <div className={`flex items-center text-sm ${colors.text.muted}`}>
              <MapPin className="h-3 w-3 mr-1" />
              {resolvedDistance}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
