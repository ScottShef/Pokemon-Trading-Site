
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile } from '@/types/user';

export default function Header() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Logo positioned with center at the red X location */}
      <div className="absolute pointer-events-auto" style={{ top: '70px', left: '170px' }}>
        <div 
          className="relative overflow-hidden h-64 w-64" 
          style={{ 
            transform: 'translate(-50%, -50%)',
            marginRight: '-60px'
          }}
        > 
          <img 
            src="/holo_hub_logo.png" 
            alt="HOLO HUB Logo" 
            className="h-full w-full object-contain" 
            style={{ 
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
        </div>
      </div>
      
      {/* Navigation buttons in top-right */}
      <div className="absolute top-4 right-6 flex items-center space-x-2 pointer-events-auto">
        {!user ? (
          <>
            <button onClick={() => router.push("/register")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-lg">Register</button>
            <button onClick={() => router.push("/login")} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-lg">Login</button>
          </>
        ) : (
          <>
            <span className="px-4 py-2 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-600 transition shadow-lg" onClick={() => router.push("/profile")}>{user.username}</span>
            <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition shadow-lg">Sign Out</button>
          </>
        )}
      </div>
    </header>
  );
}