import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteShell } from "./SiteShell";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Her Chat – Support for periods, PCOS, pregnancy & more",
  description: "A supportive, private space to ask questions about periods, PCOS, pregnancy, and women's health. Not medical advice.",
  icons: {
    icon: "/herchatlogo.png",
    shortcut: "/herchatlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
