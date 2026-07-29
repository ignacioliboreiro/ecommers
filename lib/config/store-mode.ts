import "server-only";

/**
 * Modo global de la instalación. Es la única perilla que decide si los
 * adaptadores externos (pagos, envíos, facturación) son los simulados o los
 * reales. Pasar una instalación de demo a producción no debería requerir
 * ningún cambio de código: solo `STORE_MODE=production` + credenciales.
 *
 * `import "server-only"` es deliberado: `process.env.STORE_MODE` no existe en
 * el bundle del navegador (no es `NEXT_PUBLIC_`), así que si un Client
 * Component importara este módulo leería `undefined` y caería silenciosamente
 * en "demo". Mejor que falle al compilar. Si un componente cliente necesita
 * saber el modo, se lo pasa un Server Component por props.
 */
export type StoreMode = "demo" | "production";

const VALID_MODES: readonly StoreMode[] = ["demo", "production"];

/**
 * Por qué el default es "demo" y no "production":
 *
 * Una instalación recién clonada no tiene credenciales de nadie. Si el default
 * fuera "production", el primer checkout intentaría cobrar con un SDK sin
 * configurar y explotaría; peor, un olvido de configuración podría terminar en
 * un intento de cobro real. Con "demo" el peor caso de un olvido es una tienda
 * que no cobra de verdad — y eso es imposible de pasar por alto, porque el
 * banner de demo se muestra en todas las páginas del storefront.
 */
const DEFAULT_MODE: StoreMode = "demo";

let warned = false;

export function getStoreMode(): StoreMode {
  const raw = process.env.STORE_MODE?.trim().toLowerCase();

  if (raw && (VALID_MODES as readonly string[]).includes(raw)) {
    return raw as StoreMode;
  }

  // Un valor inválido (ej. "prod", "PRODUCCION") es un error de configuración
  // que no debe degradar en silencio hacia el modo que cobra plata de verdad.
  if (!warned) {
    warned = true;
    if (raw) {
      console.warn(
        `[store-mode] STORE_MODE="${process.env.STORE_MODE}" no es válido ` +
          `(esperado: ${VALID_MODES.join(" | ")}). Usando "${DEFAULT_MODE}".`
      );
    } else {
      console.warn(
        `[store-mode] STORE_MODE no está definido. Usando "${DEFAULT_MODE}" ` +
          `(pagos, envíos y comprobantes simulados).`
      );
    }
  }

  return DEFAULT_MODE;
}

export function isDemoMode(): boolean {
  return getStoreMode() === "demo";
}

export function isProductionMode(): boolean {
  return getStoreMode() === "production";
}

/**
 * Guarda para código que NO debe ejecutarse nunca en producción (por ejemplo la
 * server action que simula la aprobación de un pago). Lanza en vez de devolver
 * un booleano para que olvidarse de chequear el resultado no sea una opción.
 */
export function assertDemoMode(what: string): void {
  if (!isDemoMode()) {
    throw new Error(
      `${what} solo está disponible con STORE_MODE=demo. ` +
        `El modo actual es "${getStoreMode()}".`
    );
  }
}
