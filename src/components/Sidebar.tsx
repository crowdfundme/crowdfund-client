"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="bg-gray-200 w-64 p-6 h-[calc(100vh-12rem)] fixed md:static shadow-md">
      <nav>
        <ul className="space-y-3">
          <li>
            <Link href="/" className="block p-3 hover:bg-gray-300 rounded-lg font-medium text-gray-700">Home</Link>
          </li>
          <li>
            <Link href="/funds" className="block p-3 hover:bg-gray-300 rounded-lg font-medium text-gray-700">Funds</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}