import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import Navigation from "./components/navigation/Navigation";
import Footer from "./components/navigation/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScoutsTribe",
  description: "Scout Tribe Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="text-xl font-bold hover:text-blue-600">
                    ScoutsTribe
                  </Link>
                  <div className="hidden sm:flex space-x-4">
                    <Link
                      href="/messaging"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 pb-1 border-b-2 border-transparent hover:border-blue-600"
                    >
                      Messaging
                    </Link>
                    <Link
                      href="/forms"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 pb-1 border-b-2 border-transparent hover:border-blue-600"
                    >
                      Forms
                    </Link>
                    <Link
                      href="/documents"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 pb-1 border-b-2 border-transparent hover:border-blue-600"
                    >
                      Documents
                    </Link>
                  </div>
                </div>
                <Navigation />
              </div>
            </header>
            <main className="flex-1 py-4">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
