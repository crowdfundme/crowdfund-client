"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="bg-gray-200 w-64 p-6 h-[calc(100vh-12rem)] fixed md:static shadow-md">
      <nav>
        <ul className="space-y-3">
          <li>
            <Link href="/explore" className="block p-3 hover:bg-gray-300 rounded-lg font-medium text-gray-700">Home</Link>
          </li>
          <li>
            <Link href="/explore" className="block p-3 hover:bg-gray-300 rounded-lg font-medium text-gray-700">Explore</Link>
          </li>
          <li>
            <Link href="/create-token" className="block p-3 hover:bg-gray-300 rounded-lg font-medium text-gray-700">Create Fund</Link>
          </li>
          <li>
            <Link href="/leaderboard" className="block p-3 hover:bg-gray-300 rounded-lg font-medium text-gray-700">Leaderboard</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}