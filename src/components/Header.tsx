"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { FaBars } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";

export default function Header() {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isWalletConnected, setIsWalletConnected } = useUser();
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [prevConnected, setPrevConnected] = useState(connected);
  const profileUrl = publicKey ? `/profile/${publicKey.toBase58()}` : "#";

  useEffect(() => {
    console.log(
      "Header: useEffect running - connected:",
      connected,
      "prevConnected:",
      prevConnected,
      "pathname:",
      pathname,
      "publicKey:",
      publicKey?.toBase58()
    );

    if (connected !== isWalletConnected) {
      console.log("Header: Syncing isWalletConnected to", connected);
      setIsWalletConnected(connected);

      if (connected && publicKey) {
        registerUser(publicKey.toBase58());
        toast.success("Wallet Connected", {
          description: `Connected as ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`,
        });
      }
    }

    setPrevConnected(connected);
  }, [connected, isWalletConnected, publicKey, wallet, pathname, prevConnected]);

  const registerUser = async (walletAddress: string) => {
    if (sessionStorage.getItem(`registered_${walletAddress}`)) {
      console.log("Header: User already registered for wallet:", walletAddress);
      return;
    }
    try {
      const response = await axios.post("/api/backend/users/register", { walletAddress });
      console.log("Header: User registered:", response.data);
      sessionStorage.setItem(`registered_${walletAddress}`, "true");
    } catch (error) {
      console.error("Header: Failed to register user:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
      }
    }
  };

  const handleWalletClick = () => {
    console.log("Header: Wallet button clicked - connected:", connected, "publicKey:", publicKey?.toBase58());
    if (connected && publicKey) {
      setIsWalletMenuOpen(!isWalletMenuOpen);
      setIsMobileMenuOpen(false);
    } else {
      console.log("Header: Opening wallet modal from Connect Wallet");
      setIsWalletMenuOpen(false);
      setVisible(true);
    }
  };

  const handleDisconnect = async () => {
    console.log("Header: Disconnect clicked from", pathname);
    await disconnect();
    setIsWalletMenuOpen(false);
    setIsMobileMenuOpen(false);
    toast.info("Wallet Disconnected");
    if (pathname !== "/" && pathname !== "/explore") {
      console.log("Header: Disconnecting, navigating to /explore from", pathname);
      router.push("/explore");
    }
  };

  const toggleMobileMenu = () => {
    console.log("Header: Toggling mobile menu - current state:", isMobileMenuOpen);
    setIsMobileMenuOpen((prev) => !prev);
    setIsWalletMenuOpen(false);
  };

  const handleCreateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!connected) {
      e.preventDefault();
      console.log("Header: Create clicked, not connected - opening wallet modal");
      setVisible(true);
      setIsMobileMenuOpen(false); // Close mobile menu
    } else {
      console.log("Header: Create clicked, connected - navigating to /create-token");
      setIsMobileMenuOpen(false); // Close mobile menu
      // Allow default navigation to /create-token
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <header className="bg-white text-black p-4 flex justify-between items-center relative">
      <div className="flex items-center">
        <a href="/">
          <div className="w-9 h-9 lg:w-12 lg:h-12 max-w-[150px]">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
        </a>
      </div>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-6 items-center">
          <a
            href="https://x.com/Crowdfunddotfun"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 text-black"
          >
            <FaXTwitter size={20} />
          </a>
          <Link
            href="/create-token"
            onClick={handleCreateClick}
            className="hover:text-gray-600 hover:underline font-medium text-black"
          >
            Create
          </Link>
          <Link
            href="/explore"
            className="hover:text-gray-600 hover:underline font-medium text-black"
          >
            Crowd
          </Link>
          <Link
            href="/crowdfund-guide"
            className="hover:text-gray-600 hover:underline font-medium text-black"
          >
            Guide
          </Link>
        </nav>
        <div className="relative">
          <button
            onClick={handleWalletClick}
            className={`underline hover:text-gray-600 font-medium ${connecting ? "text-gray-400" : "text-black"}`}
            disabled={connecting}
          >
            {connecting
              ? "Connecting..."
              : connected && publicKey
                ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                : "Connect Wallet"}
          </button>
          {connected && publicKey && isWalletMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white text-black border border-gray-300 rounded-lg shadow-xl z-10">
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-black hover:text-gray-600 focus:outline-none"
          >
            <FaBars size={24} />
          </button>
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full right-0 mt-4 w-48 bg-white text-black border border-gray-300 rounded-lg shadow-xl z-20">
              <ul className="flex flex-col">
                <li>
                  <a
                    href="https://x.com/Crowdfunddotfun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 hover:bg-gray-100 rounded-t-lg text-black"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <Link
                    href="/create-token"
                    onClick={handleCreateClick}
                    className="block px-4 py-2 hover:bg-gray-100 hover:underline text-black"
                  >
                    Create
                  </Link>
                </li>
                <li>
                  <Link
                    href="/explore"
                    className="block px-4 py-2 hover:bg-gray-100 hover:underline text-black"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Crowd
                  </Link>
                </li>
                <li>
                  <Link
                    href="/crowdfund-guide"
                    className="block px-4 py-2 hover:bg-gray-100 hover:underline text-black"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Guide
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}