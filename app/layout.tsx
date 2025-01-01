import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://pixel.digicraft.one'),
  title: "Color Picker - DigiCraft Tools",
  description: "Free online tool to extract colors from images. Get HEX, RGB, and HSL color codes with our easy-to-use color picker. Create and save color palettes instantly.",
  keywords: "color picker, image color extractor, color palette generator, hex color picker, rgb color picker, web design tools, digicraft tools",
  openGraph: {
    title: "Color Picker - DigiCraft Tools",
    description: "Extract colors from images and create beautiful color palettes with our free online tool.",
    url: 'https://pixel.digicraft.one',
    siteName: "DigiCraft Tools",
    images: [
      {
        url: 'https://pixel.digicraft.one/logo.png',
        width: 192,
        height: 192,
        alt: "DigiCraft Color Picker Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Picker - DigiCraft Tools",
    description: "Extract colors from images and create beautiful color palettes with our free online tool.",
    creator: "@digicraft",
    images: ['https://pixel.digicraft.one/logo.png'],
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        url: '/logo.png',
      },
    ],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  authors: [
    { name: 'DigiCraft', url: 'https://digicraft.one' }
  ],
  generator: 'DigiCraft Tools',
  applicationName: 'DigiCraft Color Picker',
  referrer: 'origin-when-cross-origin',
  creator: 'DigiCraft',
  publisher: 'DigiCraft',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://pixel.digicraft.one" />
        <meta name="theme-color" content="#0a0a15" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
