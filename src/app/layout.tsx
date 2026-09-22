import type { Metadata } from "next";
import localFont from "next/font/local";
import PageTransition from "@/components/site/page-transition";
import "./globals.css";

const interFont = localFont({ src: "../../public/fonts/inter-latin-variable.woff2", variable: "--font-inter", display: "swap", weight: "400 900" });

export const metadata: Metadata = {
  title: "Star Production House | Commercials & 4K Cinema",
  description: "Star Production House — commercials and 4K cinema. See our identity reflected through the lens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={interFont.variable}>
      <body>{children}<PageTransition /></body>
    </html>
  );
}
