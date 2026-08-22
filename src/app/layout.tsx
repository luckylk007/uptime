import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "UptimePro — Monitor Your Websites. Stay 100% Online.",
  description: "Real-time uptime monitoring, instant alerts, and detailed performance insights with enterprise-grade SSRF defense.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased bg-[#f8fafc] text-slate-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-semibold text-slate-700">UptimePro Monitoring System &copy; 2026</span>
              <span className="text-slate-400">All Systems Operational • Powered by Edge Network</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}