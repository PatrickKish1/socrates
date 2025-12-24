import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppKitProvider } from "@/components/providers/appkit-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Socrates - AI Prediction Market Analyst",
    template: "%s | Socrates",
  },
  description: "AI-powered prediction market analysis and signals for Polymarket and Kalshi. Get intelligent market predictions, real-time analysis, and data-driven insights for prediction markets.",
  keywords: [
    "prediction markets",
    "polymarket",
    "kalshi",
    "AI analysis",
    "market predictions",
    "trading signals",
    "forecasting",
    "market intelligence",
  ],
  authors: [{ name: "Socrates" }],
  creator: "Socrates",
  publisher: "Socrates",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://socrates.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Socrates",
    title: "Socrates - AI Prediction Market Analyst",
    description: "AI-powered prediction market analysis and signals for Polymarket and Kalshi",
    images: [
      {
        url: "/logo-socrates.png",
        width: 1200,
        height: 630,
        alt: "Socrates - AI Prediction Market Analyst",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Socrates - AI Prediction Market Analyst",
    description: "AI-powered prediction market analysis and signals for Polymarket and Kalshi",
    images: ["/logo-socrates.png"],
    creator: "@socrates",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AppKitProvider>
            {children}
          </AppKitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
