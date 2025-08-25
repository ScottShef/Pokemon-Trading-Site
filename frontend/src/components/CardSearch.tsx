// this file is part of a React component for searching Pokémon cards

"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { debounce } from "lodash";
// Import the new, leaner interface for search results.
import { ICardSearchResult } from "@/types/pokemon";

export default function CardSearch() {
  const [query, setQuery] = useState("");
  // The `cards` state is now strongly typed with the search result interface.
  const [cards, setCards] = useState<ICardSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The fetch function is wrapped in useCallback and debounced.
  // This prevents sending a request on every keystroke, improving performance.
  const fetchCards = useCallback(
    debounce(async (searchQuery: string) => {
      // Only proceed if there is a query.
      if (!searchQuery) {
        setCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // The API endpoint is already correct.
        const res = await axios.get<ICardSearchResult[]>(`/api/cards/search?q=${encodeURIComponent(searchQuery)}`);
        setCards(res.data || []);
      } catch (err) {
        console.error("Failed to search for cards:", err);
        setError("Failed to load search results.");
        setCards([]);
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms debounce delay.
    []
  );

  useEffect(() => {
    fetchCards(query);
  }, [query, fetchCards]);

  return (
    <div className="mb-6 relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a Pokémon card..."
        className="w-full p-3 rounded-lg border bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {loading && <p className="mt-2 text-gray-400">Searching...</p>}
      {error && <p className="mt-2 text-red-500">{error}</p>}

      {cards.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            // Each search result is now a link to the detailed card page.
            <Link href={`/cards/${card.apiId}`} key={card.apiId}>
              <div className="border border-gray-700 bg-gray-800 p-3 rounded-lg shadow-md hover:bg-gray-700 hover:border-purple-500 transition-all duration-200 flex items-center gap-4 h-full">
                <img
                  src={card.images?.small || "/placeholder.png"}
                  alt={card.name}
                  className="w-20 h-auto object-contain rounded-md"
                />
                <div className="flex-1">
                  <h2 className="font-bold text-white text-md">{card.name}</h2>
                  {card.set?.name && <p className="text-sm text-gray-400">{card.set.name}</p>}
                  {card.rarity && <p className="text-xs text-gray-500">{card.rarity}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

