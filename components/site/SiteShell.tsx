"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/site/AuthModal";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const isAdmin = usePathname() === "/admin";
  return (
    <AuthProvider>
      <div
        className={
          isAdmin
            ? "flex h-screen overflow-hidden"
            : "flex min-h-screen flex-col"
        }
      >
        {!isAdmin && <Header />}
        <main className={isAdmin ? "min-h-0 flex-1 overflow-hidden" : "flex-1"}>
          {children}
        </main>
        {!isAdmin && <Footer />}
        <Toaster richColors position="top-right" />
      </div>
    </AuthProvider>
  );
}
