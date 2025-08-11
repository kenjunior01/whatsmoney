import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
// Added SessionProvider for authentication
import { SessionProvider } from "@/components/session-provider"

export const metadata: Metadata = {
  title: "WhatsMoney - Monetize seu Status do WhatsApp",
  description: "Plataforma que conecta usuários do WhatsApp com empresas anunciantes. Ganhe dinheiro com seus stories!",
  generator: "WhatsMoney",
  applicationName: "WhatsMoney",
  referrer: "origin-when-cross-origin",
  keywords: ["WhatsApp", "Status", "Monetização", "Anúncios", "Marketplace", "Brasil"],
  authors: [{ name: "WhatsMoney Team" }],
  creator: "WhatsMoney",
  publisher: "WhatsMoney",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://whatsmoney.vercel.app"),
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/pt-BR",
      "en-US": "/en-US",
      "es-ES": "/es-ES",
    },
  },
  openGraph: {
    title: "WhatsMoney - Monetize seu Status do WhatsApp",
    description: "Conectamos usuários que vendem espaço em seus status do WhatsApp com empresas anunciantes.",
    url: "https://whatsmoney.vercel.app",
    siteName: "WhatsMoney",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsMoney - Monetize seu Status do WhatsApp",
    description: "Conectamos usuários que vendem espaço em seus status do WhatsApp com empresas anunciantes.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WhatsMoney",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <meta name="theme-color" content="#16a34a" />
        <meta name="background-color" content="#ffffff" />
        <meta name="display" content="standalone" />
        <meta name="orientation" content="portrait" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      </head>
      <body className="antialiased">
        {/* Wrapped children with SessionProvider for authentication context */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
