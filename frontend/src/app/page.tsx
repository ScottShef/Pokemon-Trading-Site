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

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Pokémon Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
          >
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="rounded-md w-full h-48 object-cover"
            />
            <h2 className="text-lg font-semibold mt-2">{listing.title}</h2>
            <p className="text-sm text-gray-600">
              {listing.condition}
              {listing.graded
                ? ` • ${listing.gradingCompany} ${listing.grade}`
                : ""}
            </p>
            <p className="font-bold mt-1">${listing.price}</p>
            {listing.owner && (
              <p className="text-xs text-gray-500">
                Seller: {listing.owner.username}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
