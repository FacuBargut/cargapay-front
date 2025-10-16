import type { NextConfig } from "next";
import withPWA from "next-pwa";

// 1. Configuramos el plugin de PWA
const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Se desactiva en desarrollo para no interferir
});

// 2. Definimos nuestra configuración de Next.js (incluyendo la tuya)
const nextConfig: NextConfig = {
  // Tu configuración existente para ocultar el indicador de devTools
  devIndicators: false
  // Aquí podés agregar más configuraciones de Next.js en el futuro
};

// 3. Exportamos la configuración envuelta por el plugin de PWA
export default withPWAConfig(nextConfig);