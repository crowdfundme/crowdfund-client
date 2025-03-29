import "../styles/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WalletProviderComponent from "../components/WalletProvider";
import "@solana/wallet-adapter-react-ui/styles.css";
import ClientLayout from "../components/ClientLayout"; // New Client Component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProviderComponent>
          <ClientLayout>{children}</ClientLayout>
        </WalletProviderComponent>
      </body>
    </html>
  );
}