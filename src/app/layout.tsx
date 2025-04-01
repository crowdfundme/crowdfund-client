import "../styles/globals.css";
import type { Metadata } from "next";
import { UserProvider } from "../context/UserContext";
import "@solana/wallet-adapter-react-ui/styles.css";
import WalletWrapper from "../components/WalletWrapper";

export const metadata: Metadata = {
  title: "Crowd Fund",
  description: "A decentralized crowdfunding platform on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("[RootLayout] Rendering layout...");
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <UserProvider>
          <WalletWrapper>{children}</WalletWrapper>
        </UserProvider>
      </body>
    </html>
  );
}