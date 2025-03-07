import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "isidor",
  description: "AI-powered protocols for human optimization",
  icons: {
    icon: [
      { url: '/icon-16px.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-128px.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon-256px.png', sizes: '256x256', type: 'image/png' },
      { url: '/icon-512px.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-128px.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon-256px.png', sizes: '256x256', type: 'image/png' },
    ],
    shortcut: '/icon-512px.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'isidor',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://isidor.ai',
    siteName: 'isidor',
    title: 'isidor',
    description: 'AI-powered protocols for human optimization',
    images: [
      {
        url: '/icon-512px.png',
        width: 512,
        height: 512,
        alt: 'isidor Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'isidor',
    description: 'AI-powered protocols for human optimization',
    images: ['/icon-512px.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-[100dvh]">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
        <link rel="icon" href="/icon-16px.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/icon-128px.png" sizes="128x128" type="image/png" />
        <link rel="icon" href="/icon-256px.png" sizes="256x256" type="image/png" />
        <link rel="icon" href="/icon-512px.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-128px.png" sizes="128x128" />
        <link rel="apple-touch-icon" href="/icon-256px.png" sizes="256x256" />
        <link rel="shortcut icon" href="/icon-512px.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-[100dvh] overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
