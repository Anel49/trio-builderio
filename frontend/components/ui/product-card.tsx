import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, MapPin, X as XIcon, MoreVertical } from "lucide-react";
import { colors, combineColors } from "@/lib/colors";
import { ENABLE_FAVORITES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  animations,
  spacing,
  typography,
  shadows,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  rating: number | null;
  reviews?: number;
  image: string;
  host: string;
  hostUserId?: number;
  hostUsername?: string;
  type?: string;
  categories?: string[];
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
  onEditClick?: () => void;
  onDisableClick?: () => void;
  onEnableClick?: () => void;
  delivery?: boolean;
  freeDelivery?: boolean;
  isFavorited?: boolean;
  enabled?: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  rating,
  reviews,
  image,
  host,
  hostUserId,
  hostUsername,
  type,
  categories,
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
  onEditClick,
  onDisableClick,
  onEnableClick,
  delivery,
  freeDelivery,
  isFavorited = false,
  enabled = true,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const distanceText =
    typeof distance === "string" && distance.trim() ? distance.trim() : null;
  const resolvedDistance = distanceText ?? "Distance unavailable";
  const displayCategories = (
    categories && categories.length > 0 ? categories : type ? [type] : []
  ).slice(0, 3);

  const handleClick = (e: React.MouseEvent) => {
    // Allow standard browser navigation (Ctrl+click, middle-click, etc.)
    if (e.ctrlKey || e.metaKey || e.button === 1 || e.button === 2) {
      return;
    }
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      navigate(`/listing/${id}`);
    }
  };

  return (
    <a
      href={`/listing/${id}`}
      className={combineTokens(
        "group cursor-pointer block no-underline text-inherit",
        animations.combinations.productCard,
        shadows.hover.productCard,
        !enabled ? "opacity-25" : "",
        className || "",
      )}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Card className="h-full">
        <div className="relative">
          <img
            src={image}
            alt={name}
            className={combineTokens(
              "w-full object-cover",
              spacing.dimensions.productImage,
            )}
          />
          {ENABLE_FAVORITES && authUser && (
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
                  fill:
                    isHeartHovered || isFavorited ? "#ff6f6f" : "transparent",
                }}
              />
            </Button>
          )}
          {(onDeleteClick ||
            onEditClick ||
            onDisableClick ||
            onEnableClick) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className={combineTokens(
                    layouts.absolute.topRight,
                    "border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400",
                    "mr-0 mt-0",
                    !enabled
                      ? "opacity-100 hover:opacity-100 focus:opacity-100"
                      : "hover:opacity-100 focus:opacity-100",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label="Listing options"
                  title="Listing options"
                >
                  <MoreVertical
                    className={combineTokens(spacing.dimensions.icon.sm)}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditClick && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick();
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                )}
                {enabled && onDisableClick && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisableClick();
                    }}
                    className="text-yellow-600 focus:bg-yellow-50 focus:text-yellow-600"
                  >
                    Disable
                  </DropdownMenuItem>
                )}
                {!enabled && onEnableClick && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnableClick();
                    }}
                    className="text-green-600 focus:bg-green-50 focus:text-green-600"
                  >
                    Enable
                  </DropdownMenuItem>
                )}
                {onDeleteClick && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick();
                    }}
                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {displayCategories.length > 0 && (
            <div
              className={combineTokens(
                layouts.absolute.bottomLeft,
                "flex flex-wrap gap-2 p-2",
              )}
            >
              {displayCategories.map((category) => (
                <Badge
                  key={category}
                  className={combineTokens("bg-black/60 text-white")}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}
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
                  className={combineTokens(
                    typography.size.sm,
                    colors.text.muted,
                  )}
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
                    rating == null
                      ? colors.rating.starEmpty
                      : colors.rating.star,
                  )}
                />
                {rating == null ? "Not yet rated" : rating}
              </div>
              {typeof reviews === "number" && reviews > 0 && (
                <div>
                  ({reviews} {reviews === 1 ? "review" : "reviews"})
                </div>
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
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hostUsername) {
                    navigate(`/profile/${hostUsername}`);
                  } else if (hostUserId) {
                    navigate(`/profile/${hostUserId}`);
                  }
                }}
                className={`text-sm ${colors.text.muted} hover:underline cursor-pointer`}
              >
                Hosted by {host.split(" ")[0]}
              </button>
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
    </a>
  );
}
