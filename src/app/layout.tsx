import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChainWhale - Blockchain Explorer",
  description: "Blockchain exploration and analysis platform powered by AI",
  keywords: ["blockchain", "crypto", "explorer", "analysis", "web3"],
  authors: [{ name: "ChainsQueen" }],
  creator: "ChainsQueen",
  publisher: "ChainsQueen",
  icons: {
    icon: "/chainwhale/favicon.svg",
    apple: "/chainwhale/favicon.svg",
  },
  manifest: "/chainwhale/site.webmanifest",
  metadataBase: new URL("https://chainsqueen.github.io/chainwhale"),
  openGraph: {
    title: "ChainWhale - Blockchain Explorer",
    description: "Blockchain exploration and analysis platform powered by AI",
    url: "https://chainsqueen.github.io/chainwhale",
    siteName: "ChainWhale",
    images: [
      {
        url: "/chainwhale/chainwhale-logo.svg",
        width: 200,
        height: 200,
        alt: "ChainWhale Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainWhale - Blockchain Explorer",
    description: "Blockchain exploration and analysis platform powered by AI",
    images: ["/chainwhale/chainwhale-logo.svg"],
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
