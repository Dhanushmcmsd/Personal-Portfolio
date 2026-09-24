import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Archivo_Black, DM_Sans, Plus_Jakarta_Sans, Saira_Stencil_One, Teko } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-experience",
});

const stardom = localFont({
  src: "../../public/fonts/stardom.woff2",
  variable: "--font-name",
  display: "swap",
});

const teko = Teko({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-hero-body",
});

const kola = Saira_Stencil_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-nav",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Dhanush Raghav M — Full-Stack AI Engineer",
  description:
    "Immersive 3D portfolio of Dhanush Raghav M — Full-Stack AI Software Engineer building web, mobile, and ML products end-to-end.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06080B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${dmSans.variable} ${plusJakarta.variable} ${stardom.variable} ${teko.variable} ${kola.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
