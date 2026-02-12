import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartChat - AI Customer Support",
  description:
    "AI-powered customer support chatbot platform. Build, train, and deploy intelligent chatbots that understand your business.",
  keywords: ["AI", "chatbot", "customer support", "SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <I18nProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
