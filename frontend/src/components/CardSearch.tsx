// this file is part of a React component for searching Pokémon cards

"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CardSearch() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setCards([]);
      return;
    }

    const fetchCards = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/cards/search?q=${encodeURIComponent(query)}`);
        setCards(res.data.results || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchCards, 300); // debounce 300ms
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mb-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, number, rarity, or set..."
        className="w-full p-2 rounded border focus:outline-none focus:ring focus:border-blue-400"
      />

      {loading && <p>Loading...</p>}

      {cards.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.apiId} className="border p-2 rounded shadow flex">
              <img
                src={card.images?.small || "/placeholder.png"}
                alt={card.name}
                className="w-20 h-28 object-contain mr-4"
              />
              <div>
                <h2 className="font-bold">{card.name}</h2>
                <p>Number: {card.number}</p>
                <p>Rarity: {card.rarity}</p>
                <p>Set: {card.set?.name} ({card.set?.series})</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
