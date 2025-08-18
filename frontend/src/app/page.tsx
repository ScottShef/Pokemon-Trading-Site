
"use client";

import { useEffect, useState, useCallback } from "react";
import { Textfit } from "react-textfit";
import axios from "axios";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Header from "../components/Header"; // Import the shared header

// --- TYPE DEFINITIONS ---
interface PokemonCard {
  _id: string;
  name: string;
  number: string;
  images: { small?: string; large?: string; };
  set: { name:string; };
  tcgplayer?: any;
}
type SortOrder = 'price-desc' | 'price-asc';

export default function DatabasePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sort') as SortOrder) || 'price-desc'
  );

  const fetchCards = useCallback(async (query: string, sort: SortOrder) => {
    try {
      const res = await axios.get<PokemonCard[]>(
        `http://localhost:5000/api/cards/search?q=${encodeURIComponent(query)}&sort=${sort}`
      );
      setCards(res.data);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  }, []);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    const sort = (searchParams.get('sort') as SortOrder) || 'price-desc';
    setSearchQuery(query);
    setSortOrder(sort);
    fetchCards(query, sort);
  }, [searchParams, fetchCards]);

  const updateURLParams = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      value ? params.set(key, value) : params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    updateURLParams({ q: newQuery });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value as SortOrder;
    setSortOrder(newSortOrder);
    updateURLParams({ sort: newSortOrder });
  };

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
      <Header />
      <div className="text-center mb-8">
          <h2 className="text-4xl font-bold">Card Pricing Database</h2>
          <p className="text-gray-400">Search and analyze prices from across the web.</p>
      </div>

      <div className="mb-6 flex justify-center items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search cards by name, number..."
          className="w-full max-w-md px-3 py-2 rounded-md text-gray-800 bg-gray-100"
        />
        <select
          value={sortOrder}
          onChange={handleSortChange}
          className="w-52 px-2 py-2 rounded-md text-gray-800 bg-gray-100"
        >
          <option value="price-desc">Price: High → Low</option>
          <option value="price-asc">Price: Low → High</option>
        </select>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 justify-center">
        {cards.map((card) => {
          const priceSegments: string[] = [];
          if (card.tcgplayer?.prices?.normal?.market != null) priceSegments.push(`Normal: $${card.tcgplayer.prices.normal.market.toFixed(2)}`);
          if (card.tcgplayer?.prices?.holofoil?.market != null) priceSegments.push(`Holofoil: $${card.tcgplayer.prices.holofoil.market.toFixed(2)}`);
          return (
            <div key={card._id} onClick={() => router.push(`/cards/${card._id}`)} className="p-3 rounded-xl transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl bg-[#4B4B5A] flex flex-col items-center cursor-pointer">
              <img src={card.images?.small || "/placeholder.png"} alt={card.name} className="w-[220px] h-[300px] object-cover rounded-lg" />
              <div className="text-center w-full mt-2">
                <Textfit mode="single" max={16} min={10} style={{ fontWeight: 600 }}>{card.name} #{card.number}</Textfit>
                <Textfit mode="single" max={12} min={8} style={{ color: "#C5C7D0" }}>{card.set?.name}</Textfit>
                {priceSegments.length > 0 && <p className="font-bold mt-1 text-green-400 text-sm">{priceSegments.join(" | ")}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

