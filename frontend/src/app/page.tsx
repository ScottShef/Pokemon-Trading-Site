"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// Define the Listing type (matches your backend model)
interface Listing {
  _id: string;
  title: string;
  description?: string;
  price: number;
  condition: string;
  graded: boolean;
  gradingCompany?: string;
  grade?: string;
  imageUrl: string;
  owner?: {
    username: string;
  };
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    axios
      .get<Listing[]>("http://localhost:5000/api/listings")
      .then((res) => setListings(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Navigation handlers
  const handleRegisterClick = () => {
    window.location.href = "/register";
  };

  const handleLoginClick = () => {
    window.location.href = "/login";
  };

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trainer Exchange</h1>

        {/* Register, Login, and Profile Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleRegisterClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Register
          </button>
          <button
            onClick={handleLoginClick}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Login
          </button>
          <button
            onClick={handleProfileClick}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Profile / Settings
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="p-4 rounded-xl shadow hover:shadow-lg transition"
            style={{ backgroundColor: "#444654" }}
          >
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="rounded-md w-full h-48 object-cover"
            />
            <h2 className="text-lg font-semibold mt-2">{listing.title}</h2>
            <p className="text-sm text-gray-300">
              {listing.condition}
              {listing.graded
                ? ` • ${listing.gradingCompany} ${listing.grade}`
                : ""}
            </p>
            <p className="font-bold mt-1">${listing.price}</p>
            {listing.owner && (
              <p className="text-xs text-gray-400">
                Seller: {listing.owner.username}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
