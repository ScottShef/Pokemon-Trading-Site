
"use client";

import { useEffect, useState } from "react";
declare module "react-textfit";
import { Textfit } from "react-textfit";
import axios from "axios";
import { useRouter } from "next/navigation";

// --- TYPE DEFINITIONS ---
interface PokemonCard {
  _id: string;
  apiId: string;
  name: string;
  number: string;
  rarity: string;
  images: { small?: string; large?: string; };
  set: { id: string; name: string; series: string; releaseDate?: string; };
  tcgplayer?: any;
}

interface Listing {
  _id: string;
  cardName: string;
  price: number;
  condition: string;
  imageUrls: string[];
  seller: {
    _id: string;
    username: string;
    reputation: number;
    reviewCount: number;
  };
  createdAt: string;
}

// --- Defines the possible values for sorting ---
type SortOrder = 'price-desc' | 'price-asc' | 'rep-desc';

export default function MarketplacePage() {
  // --- STATE MANAGEMENT ---
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // UPDATE: State now uses the more descriptive SortOrder type
  const [sortOrder, setSortOrder] = useState<SortOrder>("price-desc");
  const [activeTab, setActiveTab] = useState<"database" | "marketplace">("database");

  const router = useRouter();

  // --- DATA FETCHING ---
  const fetchCards = async (query: string) => {
    try {
      const res = await axios.get<PokemonCard[]>(`http://localhost:5000/api/cards/search?q=${query}`);
      setCards(res.data);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await axios.get<Listing[]>("http://localhost:5000/api/listings");
      // Initial sort for listings when fetched
      setListings(res.data.sort((a, b) => b.price - a.price));
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  useEffect(() => {
    // When switching tabs, reset sort order to a safe default
    setSortOrder('price-desc');
    
    if (activeTab === "database") {
      fetchCards(searchQuery);
    } else {
      fetchListings();
    }
    
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, [activeTab]);

  // --- EVENT HANDLERS ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (activeTab === "database") {
      fetchCards(query);
    }
  };

  // UPDATE: This handler now correctly sorts each dataset independently
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const order = e.target.value as SortOrder;
    setSortOrder(order);

    if (activeTab === "database") {
      setCards(prev => [...prev].sort((a, b) => {
        const priceA = a.tcgplayer?.prices?.normal?.market || 0;
        const priceB = b.tcgplayer?.prices?.normal?.market || 0;
        return order === 'price-asc' ? priceA - priceB : priceB - priceA;
      }));
    } else {
      setListings(prev => [...prev].sort((a, b) => {
        switch (order) {
          case 'price-asc': return a.price - b.price;
          case 'rep-desc': return b.seller.reputation - a.seller.reputation;
          case 'price-desc': default: return b.price - a.price;
        }
      }));
    }
  };

  const handleCreateListingClick = () => router.push('/listing');
  const handleRegisterClick = () => router.push("/register");
  const handleLoginClick = () => router.push("/login");
  const handleProfileClick = () => router.push("/profile");
  const handleSignOut = () => {
    localStorage.removeItem("username");
    setUsername(null);
    router.push("/");
  };

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trainer Exchange</h1>
        <div className="flex items-center space-x-2">
          {/* NEW: Create Listing Button */}
          {username && activeTab === 'marketplace' && (
            <button
              onClick={handleCreateListingClick}
              className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
            >
              + Create Listing
            </button>
          )}
          {!username ? (
            <>
              <button onClick={handleRegisterClick} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Register</button>
              <button onClick={handleLoginClick} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Login</button>
            </>
          ) : (
            <>
              <span className="px-4 py-2 bg-gray-700 text-white rounded">{username}</span>
              <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Sign Out</button>
              <button onClick={handleProfileClick} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">Profile / Settings</button>
            </>
          )}
        </div>
      </div>

      {/* TABS UI */}
      <div className="mb-8 flex justify-center border-b-2 border-gray-700">
        <button 
          onClick={() => setActiveTab('database')}
          className={`px-8 py-3 text-lg font-semibold transition-colors duration-300 ${activeTab === 'database' ? 'border-b-4 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
          Pricing Database
        </button>
        <button 
          onClick={() => setActiveTab('marketplace')}
          className={`px-8 py-3 text-lg font-semibold transition-colors duration-300 ${activeTab === 'marketplace' ? 'border-b-4 border-green-500 text-white' : 'text-gray-400 hover:text-white'}`}>
          Marketplace
        </button>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 flex justify-center items-center gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={activeTab === 'database' ? "Search cards by name, number..." : "Search marketplace listings..."}
            className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300"
            disabled={activeTab === 'marketplace'}
          />
        </div>
        <div className="w-52">
          {/* UPDATE: Dropdown now conditionally shows the reputation sort option */}
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="w-full px-2 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300"
          >
            <option value="price-desc">Price: High → Low</option>
            <option value="price-asc">Price: Low → High</option>
            {activeTab === 'marketplace' && (
              <option value="rep-desc">Reputation: High → Low</option>
            )}
          </select>
        </div>
      </div>

      {/* CONDITIONAL CONTENT RENDER */}
      {activeTab === "database" ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 justify-center">
          {cards.map((card) => {
            const priceSegments: string[] = [];
            if (card.tcgplayer?.prices?.normal?.market != null) priceSegments.push(`Normal: $${card.tcgplayer.prices.normal.market.toFixed(2)}`);
            if (card.tcgplayer?.prices?.holofoil?.market != null) priceSegments.push(`Holofoil: $${card.tcgplayer.prices.holofoil.market.toFixed(2)}`);
            return (
              <div key={card._id} onClick={() => router.push(`/cards/${card._id}`)} className="p-3 rounded-xl transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl bg-[#4B4B5A] border border-[#5C5C6E] flex flex-col items-center cursor-pointer">
                <img src={card.images?.small || "/placeholder.png"} alt={card.name} style={{ width: "220px", height: "300px", objectFit: "cover", borderRadius: "8px" }} />
                <div className="text-center w-full mt-2">
                  <Textfit mode="single" max={16} min={10} style={{ fontWeight: 600, width: "100%" }}>{card.name} #{card.number}</Textfit>
                  <Textfit mode="single" max={12} min={8} style={{ color: "#C5C7D0", width: "100%" }}>{card.set?.name}</Textfit>
                  {priceSegments.length > 0 && <p className="font-bold mt-1 text-green-400 text-sm">{priceSegments.join(" | ")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 justify-center">
          {listings.map((listing) => (
            <div key={listing._id} className="p-4 rounded-xl bg-[#4B4B5A] border border-[#5C5C6E] flex flex-col items-center gap-3 transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl cursor-pointer">
              <img 
                src={listing.imageUrls[0] || '/placeholder.png'}
                alt={listing.cardName} 
                className="w-full h-auto object-cover rounded-lg shadow-lg"
              />
              <div className="text-center w-full mt-2">
                <h3 className="text-lg font-bold text-white truncate">{listing.cardName}</h3>
                <p className="text-2xl font-black text-green-400 my-1">${listing.price.toFixed(2)}</p>
                <p className="text-sm text-gray-300 font-medium">Condition: {listing.condition}</p>
                <div className="mt-3 pt-3 border-t border-gray-600 w-full text-xs">
                  <p className="text-gray-400">Seller: <span className="font-semibold text-white">{listing.seller.username}</span></p>
                  <p className="text-gray-400">Rep: <span className="font-semibold text-white">{listing.seller.reputation}% ({listing.seller.reviewCount} reviews)</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

