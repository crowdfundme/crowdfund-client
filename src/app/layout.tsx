import "../styles/globals.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import WalletProviderComponent from "../components/WalletProvider";
import "@solana/wallet-adapter-react-ui/styles.css"; // Add this

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-100">
        <WalletProviderComponent>
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6 bg-white rounded-tl-lg shadow-md">{children}</main>
          </div>
          <Footer />
        </WalletProviderComponent>
      </body>
    </html>
  );
}