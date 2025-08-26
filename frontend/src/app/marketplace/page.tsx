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
  const [filteredListings, setFilteredListings] = useState<IListing[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('createdAt-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/listings");
      const fetchedListings = res.data?.listings || [];
      setListings(fetchedListings);
      setFilteredListings(fetchedListings);
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

  // Filter listings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(listing =>
        listing.card_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (listing.seller_info?.username && listing.seller_info.username.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredListings(filtered);
    }
  }, [searchQuery, listings]);

  const sortedListings = [...filteredListings].sort((a, b) => {
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
    <main 
      className="px-6 sm:px-12 lg:px-24 pt-20 min-h-screen"
      style={{ backgroundColor: "#343541", color: "#ECECF1" }}
    >
      <Header />

      {/* Banner */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold">Pokemon Card Marketplace</h2>
        <p className="text-gray-400 text-xs">
          Buy and sell Pokemon cards with other collectors
        </p>
      </div>

      {/* Search + Sort + Action Buttons */}
      <div className="mb-4 flex flex-col gap-2 items-center">
        <div className="flex gap-2 w-full max-w-4xl mx-auto justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings by card name or seller..."
            className="flex-1 min-w-[400px] px-4 py-1 rounded-md text-gray-800 bg-gray-100 text-sm text-center"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="w-40 px-2 py-1 rounded-md text-gray-800 bg-gray-100 text-sm"
          >
            <option value="createdAt-desc">Newest</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="price-asc">Price: Low → High</option>
          </select>
          <button 
            onClick={() => router.push("/marketplace/listing/create")} 
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
          >
            Create Listing
          </button>
          <button 
            onClick={() => router.push("/")} 
            className="px-3 py-1 bg-purple-700 text-white rounded hover:bg-purple-800 transition text-sm"
          >
            Pricing Database
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-400">Loading listings...</p>}
      {error && <p className="text-center text-red-400">{error}</p>}
      
      {!loading && !error && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 justify-center">
          {sortedListings.map((listing) => (
            <div
              key={listing.id}
              className="p-2 rounded-xl transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl bg-[#4B4B5A] flex flex-col items-center cursor-pointer h-[450px] w-[240px]"
            >
              <div className="w-[230px] h-[290px] flex items-center justify-center bg-[#2F2F3A] rounded-lg overflow-hidden">
                <img
                  src={listing.image_urls?.[0] || '/placeholder.svg'}
                  alt={listing.card_name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="text-center w-full mt-2 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <p
                    className="font-semibold text-base text-white break-words whitespace-normal leading-tight line-clamp-2"
                    title={listing.card_name}
                  >
                    {listing.card_name}
                  </p>
                  <p className="text-sm text-gray-300">
                    {listing.listing_type === 'graded' 
                      ? `Graded: ${listing.graded_company} ${listing.graded_grade}` 
                      : 'Raw'
                    }
                  </p>
                  <p className="text-xs text-purple-300">
                    Seller: {listing.seller_info?.username || 'Unknown'}
                  </p>
                </div>
                
                <p className="font-bold text-green-400 text-lg">
                  ${listing.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedListings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchQuery ? `No listings found for "${searchQuery}"` : "No listings available"}
          </p>
        </div>
      )}
    </main>
  );
}
