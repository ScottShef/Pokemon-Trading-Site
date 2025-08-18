
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    setUsername(null);
    router.push("/"); // Redirect to home after sign out
  };

  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold cursor-pointer" onClick={() => router.push('/')}>Trainer Exchange</h1>
      <nav className="flex items-center space-x-4">
        {/* Navigation Links */}
        <a href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/' ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Pricing Database</a>
        <a href="/marketplace" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/marketplace' ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Marketplace</a>

        {/* Authentication Buttons */}
        <div className="flex items-center space-x-2">
          {!username ? (
            <>
              <button onClick={() => router.push("/register")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Register</button>
              <button onClick={() => router.push("/login")} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Login</button>
            </>
          ) : (
            <>
              <span className="px-4 py-2 bg-gray-700 text-white rounded cursor-pointer" onClick={() => router.push("/profile")}>{username}</span>
              <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Sign Out</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}