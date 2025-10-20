import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layouts/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChainWhale - AI-Powered Blockchain Analytics",
  description: "AI-powered blockchain analytics for intelligent wallet analysis and whale tracking",
  keywords: ["blockchain", "crypto", "explorer", "analysis", "web3", "whale", "tracking", "wallet", "portfolio", "AI", "analytics"],
  authors: [{ name: "ChainsQueen" }],
  creator: "ChainsQueen",
  publisher: "ChainsQueen",
  icons: {
    icon: "/whalelogo.png",
    apple: "/whalelogo.png",
  },
  openGraph: {
    title: "ChainWhale - AI-Powered Blockchain Analytics",
    description: "AI-powered blockchain analytics for intelligent wallet analysis and whale tracking",
    url: "https://chainsqueen.github.io/chainwhale",
    siteName: "ChainWhale",
    images: [
      {
        url: "/whalelogo.png",
        width: 512,
        height: 512,
        alt: "ChainWhale Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainWhale - AI-Powered Blockchain Analytics",
    description: "AI-powered blockchain analytics for intelligent wallet analysis and whale tracking",
    images: ["/whalelogo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
