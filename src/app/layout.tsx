// src/app/layout.tsx
import { Fira_Code } from "next/font/google";
import "../styles/globals.css";
import type { Metadata } from "next";
import { UserProvider } from "../context/UserContext";
import "@solana/wallet-adapter-react-ui/styles.css";
import WalletWrapper from "../components/WalletWrapper"; // New client-side wrapper

// Configure Fira Code
const firaCode = Fira_Code({
  subsets: ["latin"], // Latin character set
  weight: ["300", "400", "500", "700"], // Light, Regular, Medium, Bold
  variable: "--font-fira-code", // CSS variable for global use
});

export const metadata: Metadata = {
  title: "Crowd Fund",
  description: "A decentralized crowdfunding platform on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("[RootLayout] Rendering layout...");
  return (
    <html lang="en" className={firaCode.variable}>
      <body className="bg-gray-100">
        <UserProvider>
          <WalletWrapper>{children}</WalletWrapper>
        </UserProvider>
      </body>
    </html>
  );
}