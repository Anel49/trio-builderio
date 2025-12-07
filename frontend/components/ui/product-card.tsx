import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, MapPin, X as XIcon, MoreVertical } from "lucide-react";
import { colors, combineColors } from "@/lib/colors";
import { ENABLE_FAVORITES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useIsTabletOrMobile } from "@/hooks/use-mobile";
import {
  animations,
  spacing,
  typography,
  shadows,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";
import { ResponsiveImage, getWebpUrl } from "@/components/ui/responsive-image";
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
  hideDistance?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFavorite?: (name: string, id: number) => void;
  className?: string;
  priceUnitLabel?: string;
  underlinePrice?: boolean;
  onDeleteClick?: () => void;
  onEditClick?: (e?: React.MouseEvent) => void;
  onDisableClick?: () => void;
  onEnableClick?: () => void;
  delivery?: boolean;
  freeDelivery?: boolean;
  isFavorited?: boolean;
  enabled?: boolean;
  instantBookings?: boolean;
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
  hideDistance = false,
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
  instantBookings = false,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTabletOrMobile = useIsTabletOrMobile();
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const distanceText =
    typeof distance === "string" && distance.trim() ? distance.trim() : null;
  const resolvedDistance = distanceText ?? "Distance unavailable";
  const maxCategories = isTabletOrMobile && instantBookings ? 2 : 3;
  const displayCategories = (
    categories && categories.length > 0 ? categories : type ? [type] : []
  ).slice(0, maxCategories);

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
          <ResponsiveImage
            src={image}
            webpSrc={getWebpUrl(image) || undefined}
            alt={name}
            className={combineTokens(
              "w-full object-cover rounded-t-md",
              spacing.dimensions.productImage,
            )}
          />
          {ENABLE_FAVORITES && user && user.id !== hostUserId && (
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
                e.preventDefault();
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
                      if ((e as any).nativeEvent?.button !== 1) {
                        onEditClick(e);
                      }
                    }}
                    onMouseDown={(e) => {
                      if ((e as any).button === 1) {
                        e.preventDefault();
                        onEditClick(e);
                      }
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
          {instantBookings && (
            <div className={combineTokens(layouts.absolute.bottomRight, "p-2")}>
              <Badge
                variant="default"
                style={{
                  backgroundColor: "rgba(67, 115, 169, 0.6)",
                  color: "white",
                  borderColor: "transparent",
                }}
              >
                Instant Booking
              </Badge>
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
                  }
                }}
                className={`text-sm ${colors.text.muted} hover:underline cursor-pointer`}
              >
                Hosted by {host.split(" ")[0]}
              </button>
              <div
                className={`flex items-center text-sm ${colors.text.muted} ${hideDistance ? "hidden" : ""}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {resolvedDistance}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <div
                className={`flex items-center text-sm ${colors.text.muted} ${hideDistance ? "hidden" : ""}`}
              >
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
