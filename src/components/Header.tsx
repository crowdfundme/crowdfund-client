"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { FaBars, FaCompass, FaTrophy } from "react-icons/fa";

export default function Header() {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isWalletConnected, setIsWalletConnected } = useUser();
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [prevConnected, setPrevConnected] = useState(connected);

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

    // Sync isWalletConnected
    if (connected !== isWalletConnected) {
      console.log("Header: Syncing isWalletConnected to", connected);
      setIsWalletConnected(connected);

      if (connected && publicKey) {
        registerUser(publicKey.toBase58());
      }
    }

    // Navigate to /create-token when connecting from home
    if (connected && !prevConnected && pathname === "/") {
      console.log("Header: Wallet connected from home, navigating to /create-token");
      router.push("/create-token");
    }

    // Update prevConnected for next render
    setPrevConnected(connected);
  }, [connected, isWalletConnected, publicKey, wallet, pathname, prevConnected]);

  const registerUser = async (walletAddress: string) => {
    if (sessionStorage.getItem(`registered_${walletAddress}`)) {
      console.log("Header: User already registered for wallet:", walletAddress);
      return;
    }

    try {
      console.log("Header: Registering user with wallet:", walletAddress);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        walletAddress,
      });
      console.log("Header: User registered:", response.data);
      sessionStorage.setItem(`registered_${walletAddress}`, "true");
    } catch (error) {
      console.error("Header: Failed to register user:", error);
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

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md relative">
      <div className="flex items-center gap-12">
        <a href="/">
          <div className="w-9 h-9 lg:w-12 lg:h-12 max-w-[150px]">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
        </a>
        {!connected && (
          <nav className="flex gap-6">
            <Link href="/explore" className="hover:text-gray-300 font-medium flex items-center gap-2">
              <FaCompass className="md:hidden" />
              <span className="hidden md:inline">Explore</span>
            </Link>
            <Link href="/leaderboard" className="hover:text-gray-300 font-medium flex items-center gap-2">
              <FaTrophy className="md:hidden" />
              <span className="hidden md:inline">Leaderboard</span>
            </Link>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={handleWalletClick}
            className="solana-wallet-button"
            disabled={connecting}
          >
            {connecting
              ? "Connecting..."
              : connected && publicKey
              ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
              : "Connect Wallet"}
          </button>
          {connected && publicKey && isWalletMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl z-10">
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:text-gray-300 focus:outline-none"
          >
            <FaBars size={24} />
          </button>
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full right-0 mt-4 w-48 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl z-20">
              <ul className="flex flex-col">
                <li>
                  <Link
                    href="/"
                    className="block px-4 py-2 hover:bg-gray-700 rounded-t-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/explore"
                    className="block px-4 py-2 hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create-token"
                    className="block px-4 py-2 hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Fund
                  </Link>
                </li>
                <li>
                  <Link
                    href="/leaderboard"
                    className="block px-4 py-2 hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link
                    href={publicKey ? `/profile/${publicKey.toBase58()}` : "#"}
                    className={`block px-4 py-2 hover:bg-gray-700 rounded-b-lg ${
                      publicKey ? "text-white" : "text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={(e) => {
                      if (!publicKey) {
                        e.preventDefault();
                        alert("Please connect your wallet to view your profile.");
                      }
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    My Profile
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