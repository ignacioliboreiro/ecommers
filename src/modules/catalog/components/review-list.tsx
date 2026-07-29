import { Card, CardContent } from "@/components/ui/card";
import type { ProductReview } from "@/src/modules/catalog/types/catalog";

export function ReviewList({ reviews }: { reviews: ProductReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay reseñas para este producto.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{review.user.name ?? "Usuario"}</span>
                <span aria-label={`${review.rating} de 5 estrellas`}>
                  <span className="text-primary">{"★".repeat(review.rating)}</span>
                  <span className="text-muted-foreground">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
