import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildStock ERP | Construction & Hardware Materials",
  description: "Professional, fast, intuitive ERP for Construction & Hardware Material Suppliers",
  icons: {
    icon: "/favicon.ico",
  },
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
