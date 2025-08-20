"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";

// --- TYPE DEFINITIONS ---
interface Seller {
  _id: string;
  username: string;
  reputation: number;
  reviewCount: number;
}

interface Listing {
  _id: string;
  cardName: string;
  price: number;
  imageUrls: string[];
  seller: Seller;
  listingType: 'raw' | 'graded';
  rawCondition?: string;
  gradedData?: { company: string; grade: string; };
}

type SortOrder = 'price-desc' | 'price-asc' | 'rep-desc';

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('price-desc');
  const router = useRouter();

  // Fetch listings from backend
  const fetchListings = useCallback(async () => {
    try {
      const res = await axios.get<Listing[]>("http://localhost:5000/api/listings");
      setListings(res.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle sorting
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value as SortOrder;
    setSortOrder(newSortOrder);
    setListings(prev => [...prev].sort((a, b) => {
      switch (newSortOrder) {
        case 'price-asc': return a.price - b.price;
        case 'rep-desc': return b.seller.reputation - a.seller.reputation;
        case 'price-desc': default: return b.price - a.price;
      }
    }));
  };

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
      <Header />
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold">Marketplace</h2>
          <p className="text-gray-400">Browse listings from other trainers.</p>
        </div>
        <button
          onClick={() => router.push('marketplace/listing/create')}
          className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
        >
          + Create New Listing
        </button>
      </div>

      {/* Sorting */}
      <div className="mb-6 flex justify-end items-center gap-3">
        <select
          value={sortOrder}
          onChange={handleSortChange}
          className="w-52 px-2 py-2 rounded-md text-gray-800 bg-gray-100"
        >
          <option value="price-desc">Price: High → Low</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="rep-desc">Seller Rep: High → Low</option>
        </select>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 justify-center">
        {listings.map((listing) => {
          const conditionString = listing.listingType === 'raw'
            ? `Condition: ${listing.rawCondition}`
            : `Graded: ${listing.gradedData?.company} ${listing.gradedData?.grade}`;

          const reputationDisplay = `${listing.seller.reputation ?? 100}% (${listing.seller.reviewCount ?? 0})`;

          return (
            <div
              key={listing._id}
              className="p-4 rounded-xl bg-[#4B4B5A] flex flex-col items-center gap-3 transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl cursor-pointer"
            >
              <img
                src={`http://localhost:5000${listing.imageUrls[0]}`}
                alt={listing.cardName}
                className="w-full h-auto object-cover rounded-lg shadow-lg"
              />

              <div className="text-center w-full mt-2">
                <h3 className="text-lg font-bold text-white truncate">{listing.cardName}</h3>
                <p className="text-2xl font-black text-green-400 my-1">${listing.price.toFixed(2)}</p>
                <p className="text-sm text-gray-300 font-medium">{conditionString}</p>

                {/* Seller Info with Bar */}
                <div className="mt-3 pt-3 border-t border-gray-600 w-full text-xs flex items-center justify-center gap-2">
                  <span className="text-gray-400 font-medium">Seller: <span className="font-semibold text-white">{listing.seller.username}</span></span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-400 font-medium">Rep: <span className="font-semibold text-white">{reputationDisplay}</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
