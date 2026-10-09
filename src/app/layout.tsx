import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shivom Construction | Building Material Supply",
  description: "Professional, fast, intuitive ERP for Shivom Construction - Building Material Supply",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/shivom-logo.png",
    apple: "/images/shivom-logo.png",
  },
  themeColor: "#e16718",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-100">
      <body className="h-full flex flex-col font-sans antialiased text-slate-800">
        {children}
      </body>
    </html>
  );
}
