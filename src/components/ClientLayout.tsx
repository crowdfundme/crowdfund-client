"use client";

import Header from "./Header";
import Footer from "./Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1 p-6 bg-white rounded-lg shadow-md">
        {children}
      </main>
      <Footer />
    </div>
  );
}