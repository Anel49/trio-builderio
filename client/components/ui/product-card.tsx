import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Heart, MapPin } from "lucide-react";

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
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: ProductCardProps) {
  return (
    <Card
      className={`group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105 ${className || ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative">
        <img src={image} alt={name} className="w-full h-48 object-cover" />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 bg-white/80 hover:bg-white group"
          onClick={(e) => {
            e.stopPropagation();
            // Handle heart click
          }}
        >
          <Heart
            className="h-4 w-4 transition-all duration-200 fill-transparent group-hover:fill-[#ff6f6f]"
            style={{
              stroke: "#ff6f6f",
            }}
          />
        </Button>
        <Badge className="absolute bottom-3 left-3 bg-black/60 text-white">
          {type}
        </Badge>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-xl">{name}</h3>
          <div className="text-right">
            <div className="text-2xl font-bold">{price}</div>
            <div className="text-sm text-muted-foreground">/day</div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            {rating}
          </div>
          {reviews && <div>({reviews} reviews)</div>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Hosted by {host}
          </span>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {distance}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
