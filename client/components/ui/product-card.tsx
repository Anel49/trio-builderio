import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, MapPin } from "lucide-react";
import { colors, combineColors } from "@/lib/colors";
import {
  animations,
  spacing,
  typography,
  shadows,
  layouts,
  combineTokens
} from "@/lib/design-tokens";

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  rating: number;
  reviews?: number;
  image: string;
  host: string;
  type: string;
  distance: string;
  listedTime?: string;
  hideHostInfo?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFavorite?: (name: string) => void;
  className?: string;
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
}: ProductCardProps) {
  const [isHeartHovered, setIsHeartHovered] = useState(false);

  return (
    <Card
      className={combineTokens(
        'group cursor-pointer',
        animations.combinations.productCard,
        shadows.hover.productCard,
        className || ""
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative">
        <img src={image} alt={name} className={combineTokens('w-full object-cover', spacing.dimensions.productImage)} />
        <Button
          size="icon"
          variant="ghost"
          className={combineTokens(
            layouts.absolute.topRight,
            'bg-white/80 hover:bg-white',
            animations.combinations.heartButton
          )}
          onMouseEnter={() => setIsHeartHovered(true)}
          onMouseLeave={() => setIsHeartHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (onFavorite) {
              onFavorite(name);
            }
          }}
        >
          <Heart
            className={combineTokens(spacing.dimensions.icon.sm, 'heart-transition')}
            style={{
              stroke: "#ff6f6f",
              fill: isHeartHovered ? "#ff6f6f" : "transparent",
            }}
          />
        </Button>
        <Badge className={combineTokens(layouts.absolute.bottomLeft, 'bg-black/60 text-white')}>
          {type}
        </Badge>
      </div>

      <CardContent className={spacing.padding.card}>
        <div className={combineTokens(layouts.flex.between, 'items-start', spacing.margin.bottomSm)}>
          <div>
            <h3 className={combineTokens(typography.weight.semibold, typography.size.xl)}>{name}</h3>
            {listedTime && (
              <p className={combineTokens(typography.size.sm, colors.text.muted)}>
                Listed {listedTime}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className={typography.combinations.price}>{price}</div>
            <div className={combineTokens(typography.size.sm, colors.text.muted)}>/day</div>
          </div>
        </div>

        <div className={combineTokens(layouts.flex.start, 'space-x-4', typography.size.sm, colors.text.muted, 'mb-3')}>
          <div className={layouts.flex.start}>
            <Star className={combineTokens(spacing.dimensions.icon.sm, 'mr-1', colors.rating.star)} />
            {rating}
          </div>
          {reviews && <div>({reviews} reviews)</div>}
        </div>

        {!hideHostInfo && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${colors.text.muted}`}>
              Hosted by {host}
            </span>
            <div className={`flex items-center text-sm ${colors.text.muted}`}>
              <MapPin className="h-3 w-3 mr-1" />
              {distance}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
