import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CargaPay',
  description: 'Sistema de facturación para logística',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Agregamos el theme-color para la barra del navegador en mobile */}
        <meta name="theme-color" content="#111827" />
      </head>
      <body>{children}</body>
      {/* <body className={inter.className}>{children}</body> */}
    </html>
  );
}