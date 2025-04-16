// src/app/ClientLayout.tsx
"use client";

import "../lib/axios"; // Import to apply the interceptor globally
import Header from "./Header";
import Footer from "./Footer";
import { Toaster } from "sonner";

// Disable console.log in production on the client
if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  console.log = () => {};
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1 p-6 bg-white rounded-lg shadow-md">
        {children}
      </main>
      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  );
}