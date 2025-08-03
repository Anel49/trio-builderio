import { Card, CardContent } from "./ui/card";

interface CategoryCardProps {
  icon: string;
  name: string;
  count: string;
}

export function CategoryCard({ icon, name, count }: CategoryCardProps) {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-3">
          <p>{icon}</p>
        </div>
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        <p className="text-muted-foreground text-sm">{count}</p>
      </CardContent>
    </Card>
  );
}
