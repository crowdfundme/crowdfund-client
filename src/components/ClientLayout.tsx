"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const pathname = usePathname();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    // Show sidebar only if wallet is connected (responsive hiding handled by Sidebar.tsx)
    setIsSidebarVisible(connected);
  }, [connected]);

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <div className="flex flex-1 w-full">
        {isSidebarVisible && <Sidebar />}
        <main
          className={`flex-1 p-6 bg-white ${isSidebarVisible ? "rounded-tl-lg" : "rounded-lg"} shadow-md`}
        >
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}