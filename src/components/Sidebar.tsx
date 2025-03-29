"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePathname } from "next/navigation";
import { FaHome, FaCompass, FaPlusCircle, FaTrophy, FaUser } from "react-icons/fa"; // Icons

export default function Sidebar() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const profileUrl = publicKey ? `/profile/${publicKey.toBase58()}` : "#";

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="bg-gray-200 w-64 p-6 h-[calc(100vh-12rem)] fixed md:static shadow-md hidden md:block">
      <nav>
        <ul className="space-y-3">
          <li>
            <Link
              href="/"
              className={`flex items-center gap-2 p-3 hover:bg-gray-300 rounded-lg font-medium ${
                isActive("/") ? "bg-gray-300 text-gray-900" : "text-gray-700"
              }`}
            >
              <FaHome />
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/explore"
              className={`flex items-center gap-2 p-3 hover:bg-gray-300 rounded-lg font-medium ${
                isActive("/explore") ? "bg-gray-300 text-gray-900" : "text-gray-700"
              }`}
            >
              <FaCompass />
              Explore
            </Link>
          </li>
          <li>
            <Link
              href="/create-token"
              className={`flex items-center gap-2 p-3 hover:bg-gray-300 rounded-lg font-medium ${
                isActive("/create-token") ? "bg-gray-300 text-gray-900" : "text-gray-700"
              }`}
            >
              <FaPlusCircle />
              Create Fund
            </Link>
          </li>
          <li>
            <Link
              href="/leaderboard"
              className={`flex items-center gap-2 p-3 hover:bg-gray-300 rounded-lg font-medium ${
                isActive("/leaderboard") ? "bg-gray-300 text-gray-900" : "text-gray-700"
              }`}
            >
              <FaTrophy />
              Leaderboard
            </Link>
          </li>
          <li>
            <Link
              href={profileUrl}
              className={`flex items-center gap-2 p-3 hover:bg-gray-300 rounded-lg font-medium ${
                publicKey
                  ? isActive(profileUrl)
                    ? "bg-gray-300 text-gray-900"
                    : "text-gray-700"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!publicKey) {
                  e.preventDefault();
                  alert("Please connect your wallet to view your profile.");
                }
              }}
            >
              <FaUser />
              My Profile
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}