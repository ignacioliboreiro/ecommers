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
      {/*
        `tabIndex={-1}`: el <main> no es focuseable por default, así que sin
        esto el skip-link de CategoryNav mueve el scroll pero NO el foco
        real (el foco queda en <body>) — inútil para quien navega con
        teclado/lector de pantalla. `outline-none` acá es intencional (no el
        anti-patrón de ocultar el foco sin reemplazo): este es el contenedor
        que recibe el salto, no un control interactivo — ponerle un anillo
        de foco alrededor de toda la página se vería raro. El propio
        skip-link ya tiene su estado de foco visible mientras se tabula
        hasta él.
      */}
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
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
