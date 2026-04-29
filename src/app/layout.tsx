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
  metadataBase: new URL("https://soma2.b-average.com"),
  title: "NYT Cooking Healthy Dinners",
  description:
    "A curated NYT Cooking healthy dinner picker with daily recipe recommendations, category filters, ingredients, and step-by-step instructions.",
  openGraph: {
    title: "NYT Cooking Healthy Dinners",
    description:
      "A curated NYT Cooking healthy dinner picker with daily recipe recommendations, category filters, ingredients, and step-by-step instructions.",
    images: [
      {
        url: "/meta-image.jpg",
        width: 1280,
        height: 488,
        alt: "NYT Cooking Healthy Dinners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NYT Cooking Healthy Dinners",
    description:
      "A curated NYT Cooking healthy dinner picker with daily recipe recommendations, category filters, ingredients, and step-by-step instructions.",
    images: ["/meta-image.jpg"],
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
