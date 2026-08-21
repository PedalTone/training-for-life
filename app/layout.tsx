import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Training 4 Life — Move well. Stay ready.",
  description: "A private, offline-first weekly fitness tracker for broad, lifelong readiness.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/icon-192.png" },
  openGraph: { title: "Training 4 Life", description: "Move well. Stay ready.", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Training 4 Life", description: "Move well. Stay ready.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><meta name="theme-color" content="#f5f2ea"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-status-bar-style" content="default"/></head><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}<script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator&&!['localhost','127.0.0.1'].includes(location.hostname)){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}))}`}}/></body></html>;
}
