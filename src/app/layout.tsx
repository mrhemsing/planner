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

const siteDescription =
  "Five-day healthy dinner planning with NYT Cooking recipes, quick-glance recipe cards, checkable ingredients, and step-by-step instructions.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cook.b-average.com"),
  title: "NYT Cooking Healthy Dinners",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NYT Cooking Healthy Dinners",
    description: siteDescription,
    images: [
      {
        url: "/meta-image.png",
        width: 631,
        height: 238,
        alt: "NYT Cooking Healthy Dinners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NYT Cooking Healthy Dinners",
    description: siteDescription,
    images: ["/meta-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e23628] text-stone-900">
        {children}
      </body>
    </html>
  );
}
