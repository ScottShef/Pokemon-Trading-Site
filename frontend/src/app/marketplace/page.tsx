"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import { IListing } from "@/types/listing";

type SortOrder = 'price-desc' | 'price-asc' | 'createdAt-desc';

export default function MarketplacePage() {
  const [listings, setListings] = useState<IListing[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('createdAt-desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/listings");
      setListings(res.data?.listings || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load listings. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOrder) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'createdAt-desc':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <Header />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-purple-400">Marketplace</h1>
          <p className="text-gray-400 mt-1">Browse listings from other trainers.</p>
        </div>
        <Link href="/marketplace/listing/create">
          <span className="px-4 py-2 md:px-6 md:py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition cursor-pointer">
            + Create Listing
          </span>
        </Link>
      </div>

      <div className="mb-6 flex justify-end items-center gap-3">
        <label htmlFor="sortOrder" className="text-sm text-gray-300">Sort by:</label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="w-auto px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="createdAt-desc">Newest</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
        </select>
      </div>

      {loading && <p className="text-center text-gray-400">Loading listings...</p>}
      {error && <p className="text-center text-red-400">{error}</p>}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-purple-500/20"
            >
              <img
                src={listing.image_urls?.[0] || '/placeholder.png'}
                alt={listing.card_name}
                className="w-full h-auto object-cover aspect-[3/4]"
              />
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white truncate flex-grow">{listing.card_name}</h3>
                <p className="text-sm text-gray-400">
                  {listing.listing_type === 'graded' 
                    ? `Graded: ${listing.graded_company} ${listing.graded_grade}` 
                    : 'Raw'
                  }
                </p>
                <p className="text-2xl font-black text-green-400 my-2">${listing.price.toFixed(2)}</p>
                <div className="text-xs text-gray-300 mt-auto">
                  <p>Seller: <span className="font-semibold text-purple-300">{listing.seller_info?.username || 'Unknown'}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
