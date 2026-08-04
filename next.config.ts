import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 bloquea por default requests cross-origin a assets/endpoints
  // de dev (HMR, chunks de client components cargados dinámicamente, etc.)
  // que no vengan de localhost — el usuario prueba siempre desde su celular
  // real contra la IP de la red local, así que sin esto cualquier chunk que
  // no haya llegado con la carga inicial de la página puede fallar en
  // silencio para ese origen (sin tirar un error visible en consola).
  allowedDevOrigins: ["192.168.1.14"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
