import "../styles/globals.css";
import type { Metadata } from "next";
import { CustomWalletProvider } from "../components/WalletProvider";
import { UserProvider } from "../context/UserContext"; // Add UserProvider
import "@solana/wallet-adapter-react-ui/styles.css";
import ClientLayout from "../components/ClientLayout";

export const metadata: Metadata = {
  title: "Crowd Fund",
  description: "A decentralized crowdfunding platform on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <CustomWalletProvider>
          <UserProvider>
            <ClientLayout>{children}</ClientLayout>
          </UserProvider>
        </CustomWalletProvider>
      </body>
    </html>
  );
}