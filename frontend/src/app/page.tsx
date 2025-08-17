"use client";

import { useEffect, useState } from "react";
declare module "react-textfit";
import { Textfit } from "react-textfit";
import axios from "axios";

// Define the PokemonCard type (matches your backend model)
interface PokemonCard {
  _id: string;
  apiId: string;
  name: string;
  number: string;
  rarity: string;
  images: {
    small?: string;
    large?: string;
  };
  set: {
    id: string;
    name: string;
    series: string;
    releaseDate?: string;
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
    };
  };
  tcgplayer?: any;
  ebay?: any;
}

export default function Marketplace() {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all cards initially or filtered by search
  const fetchCards = async (query: string) => {
    try {
      const res = await axios.get<PokemonCard[]>(
        `http://localhost:5000/api/cards/search?q=${query}`
      );
      setCards(res.data);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCards("");
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchCards(query);
  };


  // Handler for the dropdown and sorting
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const order = e.target.value as "asc" | "desc";
    setSortOrder(order);

    // Optionally, sort the currently loaded cards in the frontend
    setCards((prevCards) => {
      return [...prevCards].sort((a, b) => {
        const priceA = a.cardmarket?.prices?.averageSellPrice || 0;
        const priceB = b.cardmarket?.prices?.averageSellPrice || 0;
        return order === "asc" ? priceA - priceB : priceB - priceA;
      });
    });
  };

  // User navigation handlers
  const handleRegisterClick = () => window.location.href = "/register";
  const handleLoginClick = () => window.location.href = "/login";
  const handleProfileClick = () => window.location.href = "/profile";
  const handleSignOut = () => {
    localStorage.removeItem("username");
    setUsername(null);
    window.location.reload();
  };

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trainer Exchange</h1>

        {/* User Buttons */}
        <div className="flex space-x-2">
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

      {/* Search Bar and Sort */}
      <div className="mb-6 flex justify-center items-center gap-3">
        {/* Search input */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search cards by name, number, rarity, or set..."
            className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-400 text-sm md:text-sm font-medium"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        {/* Sort dropdown */}
        <div className="w-36">
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="w-full px-2 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-sm font-medium cursor-pointer appearance-none"
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              fontSize: '0.875rem', // slightly smaller to prevent truncation
            }}
          >
            <option value="desc">Price: High → Low</option>
            <option value="asc">Price: Low → High</option>
          </select>
        </div>
      </div>



      {/* Cards Grid */}
      <div
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 justify-center"
        style={{
          background: "linear-gradient(180deg, #2C2C38 0%, #343541 100%)",
          padding: "2rem",
          borderRadius: "1rem",
        }}
      >
        {cards.map((card) => (
          <div
            key={card._id}
            className="p-3 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
            style={{
              backgroundColor: "#4B4B5A",
              border: "1px solid #5C5C6E",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={card.images?.small || "/placeholder.png"}
              alt={card.name}
              style={{
                width: "220px",
                height: "300px", // increased from 280px
                objectFit: "cover",
                borderRadius: "8px",
                boxShadow: "0 6px 12px rgba(0,0,0,0.4)",
                marginBottom: "0.5rem",
              }}
            />
            <div className="text-center w-full">
              <Textfit
                mode="single"
                max={16}
                min={10}
                style={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  width: "100%",
                  color: "#ECECF1",
                }}
              >
                {card.name} #{card.number}
              </Textfit>

              <Textfit
                mode="single"
                max={12}
                min={8}
                style={{
                  color: "#C5C7D0",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  width: "100%",
                }}
              >
                {card.set?.name} • {card.set?.series}
              </Textfit>

              <p
                className="font-bold mt-1"
                style={{ color: "#FFD700" }}
              >
                ${card.cardmarket?.prices?.averageSellPrice?.toFixed(2) || "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
