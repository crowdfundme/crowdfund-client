"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const { connected, publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = () => {
    console.log("Home: Wallet button clicked - connected:", connected, "publicKey:", publicKey?.toBase58());
    if (connected && publicKey) {
      disconnect();
    } else {
      console.log("Home: Opening wallet modal from Connect Wallet");
      setVisible(true);
    }
  };

  const handleCreateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!connected) {
      e.preventDefault();
      setVisible(true);
    }
  };

  // Fade-in effect for hero
  useEffect(() => {
    const hero = document.querySelector(".hero-section");
    if (hero) {
      hero.classList.add("animate-fadeIn");
    }
  }, []);

  // Call-to-action quotes
  const quotes = [
    "Launch your dream token today with Crowdfund.fun!",
    "Turn your vision into reality—start crowdfunding now!",
    "Empower your ideas with Solana’s speed on Crowdfund.fun!",
    "Your token, your future—begin with Crowdfund.fun!",
    "Join the crowdfunding revolution—launch now!",
    "Build your legacy with a token on Crowdfund.fun!",
    "Fast-track your project with Solana’s power—start today!",
    "Crowdfund your passion—create your token now!",
    "Unleash your creativity with Crowdfund.fun’s platform!",
    "Your idea deserves funding—launch it with us!",
    "Make waves with your token on Crowdfund.fun!",
    "Seize the moment—crowdfund your dream today!",
    "Solana’s speed, your success—start on Crowdfund.fun!",
    "Transform your ideas into tokens—begin now!",
    "Crowdfund.fun: Where your vision meets opportunity!",
    "Launch bold ideas with the power of Solana!",
    "Your project, your token, your way—start now!",
    "Bring your dreams to life with Crowdfund.fun!",
    "Fund the future—create your token today!",
    "Join thousands launching tokens on Crowdfund.fun!"
  ];

  return (
    <div
      className="min-h-[calc(100vh-12rem)] px-2 xs:px-3 sm:px-4 flex flex-col gap-6 sm:gap-8 relative overflow-hidden justify-center"
      style={{ background: "#ffffff" }}
    >
      {/* Hero Section */}
      <div className="hero-section flex flex-col items-center justify-center text-center mt-[-4rem] sm:mt-[-6rem]">
        <h1
          className="text-4xl xs:text-5xl sm:text-7xl font-light break-words tracking-tight"
          style={{ color: "#000000", fontFamily: "var(--font-fira-code)" }}
        >
          Crowdfund.fun
        </h1>
        <p
          className="mt-2 text-base xs:text-lg sm:text-xl max-w-md"
          style={{ color: "#000000" }}
        >
          Fund your vision with Solana’s speed.
        </p>

        {/* Wallet and Create Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={handleWalletClick}
            className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-black transition-colors duration-200"
            disabled={connecting}
            title={connected ? publicKey?.toBase58() : "Connect Wallet"}
            style={{ color: connecting ? "#000000" : "#000000", background: connecting ? "#d1d5db" : "#ffffff", borderColor: "#000000" }}
          >
            {connecting
              ? "Connecting..."
              : connected
              ? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`
              : "Connect Wallet"}
          </button>
          <Link href="/create-token" onClick={handleCreateClick}>
            <button
              className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-black transition-colors duration-200"
              style={{ color: "#000000", background: "#ffffff", borderColor: "#000000" }}
            >
              Create Now
            </button>
          </Link>
        </div>
      </div>

      {/* Quotes Carousel in Cards */}
      <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-8">
        <div className="relative overflow-hidden">
          <div className="flex animate-slide">
            {quotes.map((quote, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-8 sm:mx-12 bg-white border border-black rounded-lg shadow-sm flex items-center justify-center text-center"
                style={{ width: "300px", height: "100px" }}
              >
                <p
                  className="px-4 text-base xs:text-lg sm:text-xl font-medium"
                  style={{ color: "#000000" }}
                >
                  {quote}
                </p>
              </div>
            ))}
            {/* Duplicate quotes for seamless looping */}
            {quotes.map((quote, index) => (
              <div
                key={`duplicate-${index}`}
                className="flex-shrink-0 mx-8 sm:mx-12 bg-white border border-black rounded-lg shadow-sm flex items-center justify-center text-center"
                style={{ width: "300px", height: "100px" }}
              >
                <p
                  className="px-4 text-base xs:text-lg sm:text-xl font-medium"
                  style={{ color: "#000000" }}
                >
                  {quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for Carousel Animation */}
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-slide {
          display: flex;
          animation: slide 80s linear infinite;
          width: calc(300px * ${quotes.length * 2} + 96px * ${quotes.length * 2});
        }
      `}</style>
    </div>
  );
}