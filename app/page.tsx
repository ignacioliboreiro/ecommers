import { CategoryNav } from "@/src/modules/catalog/components/category-nav";
import { Footer } from "@/src/modules/catalog/components/footer";
import { CategoryGrid } from "@/src/modules/home/components/category-grid";
import { FeaturedProducts } from "@/src/modules/home/components/featured-products";
import { Hero } from "@/src/modules/home/components/hero";
import { PromoBanner } from "@/src/modules/home/components/promo-banner";
import { ValueProps } from "@/src/modules/home/components/value-props";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <CategoryNav />
      <main className="flex flex-1 flex-col">
        <Hero />
        <CategoryGrid />
        <FeaturedProducts />
        <PromoBanner />
        <ValueProps />
      </main>
      <Footer />
    </div>
  );
}
