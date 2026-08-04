"use client";

import { useEffect } from "react";

/**
 * iOS Safari (y varios WebView de Android) no aplican `:active` a un toque
 * si no hay al menos un listener de `touchstart` registrado en el documento
 * — es un comportamiento documentado del motor, pensado originalmente para
 * distinguir "tap" de "scroll", no un bug de esta app. Sin esto, CUALQUIER
 * `:active` del sitio (el fallback global de app/globals.css incluido)
 * puede quedar mudo en un toque real, aunque se vea perfecto en Chrome
 * DevTools o en Playwright (ninguno de los dos reproduce esta restricción).
 *
 * El listener no necesita hacer nada — su sola presencia habilita `:active`
 * en todo el documento.
 */
export function TouchActiveFix() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
