"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Header from "../components/Header";

interface PokemonCard {
  _id: string;
  name: string;
  number?: string;
  rarity?: string;
  images?: { small?: string; large?: string };
  set?: { 
    id?: string;
    name?: string; 
    series?: string;
  };
  tcgplayer?: {
    prices?: {
      normal?: { market?: number };
      holofoil?: { market?: number };
      reverseHolofoil?: { market?: number };
    };
  };
  highestMarketPrice?: number;
  lastSynced?: string;
}

type SortOrder = "name" | "price-desc" | "price-asc";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("price-desc");
  const [totalCards, setTotalCards] = useState(0);

  const fetchCards = useCallback(
    async (query: string, sort: SortOrder) => {
      try {
        setLoading(true);
        const res = await axios.get<{
          data: PokemonCard[];
          total: number;
          page: number;
          hasMore: boolean;
        }>(`/api/cards?q=${encodeURIComponent(query)}&sort=${sort}&limit=50`);
        
        setCards(res.data.data);
        setTotalCards(res.data.total);
      } catch (err) {
        console.error("Error fetching cards:", err);
        setCards([]);
        setTotalCards(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateURLParams = useCallback(
    (newParams: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        value ? params.set(key, value) : params.delete(key);
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const query = searchParams.get("q") || "";
    const sort = (searchParams.get("sort") as SortOrder) || "price-desc";

    // Filter out invalid search queries (like file paths)
    const cleanQuery = query.startsWith("/") ? "" : query;

    setSearchQuery(cleanQuery);
    setSortOrder(sort);

    fetchCards(cleanQuery, sort);

    // Clean up URL if we had an invalid query
    if (query !== cleanQuery) {
      updateURLParams({ q: cleanQuery });
    }
  }, [searchParams, fetchCards, updateURLParams]);

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
    <main
      className="px-6 sm:px-12 lg:px-24 py-6 min-h-screen"
      style={{ backgroundColor: "#343541", color: "#ECECF1" }}
    >
      <Header />

      {/* Banner */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Pokemon Card Collection</h2>
        <p className="text-gray-400 text-sm">
          Browse and search through {totalCards.toLocaleString()} Pokemon cards from our database
        </p>
      </div>

      {/* Search + Sort */}
      <div className="mb-6 flex flex-col gap-4 items-center">
        <div className="flex gap-3 w-full max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search cards by name, set, or number..."
            className="flex-1 px-3 py-2 rounded-md text-gray-800 bg-gray-100"
          />
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="w-52 px-2 py-2 rounded-md text-gray-800 bg-gray-100"
          >
            <option value="price-desc">Price: High → Low</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading cards...</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 justify-center">
          {cards.map((card) => {
            const priceSegments: string[] = [];

            if (card.tcgplayer?.prices?.normal?.market != null)
              priceSegments.push(
                `Normal: $${card.tcgplayer.prices.normal.market.toFixed(2)}`
              );
            if (card.tcgplayer?.prices?.holofoil?.market != null)
              priceSegments.push(
                `Holofoil: $${card.tcgplayer.prices.holofoil.market.toFixed(2)}`
              );
            if (card.highestMarketPrice != null && priceSegments.length === 0)
              priceSegments.push(`Market: $${card.highestMarketPrice.toFixed(2)}`);

            return (
              <div
                key={card._id}
                onClick={() => router.push(`/cards/${card._id}`)}
                className="p-2 rounded-xl transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl bg-[#4B4B5A] flex flex-col items-center cursor-pointer h-[450px] w-[240px]"
              >
                {/* Card Image */}
                <div className="w-[230px] h-[290px] flex items-center justify-center bg-[#2F2F3A] rounded-lg overflow-hidden">
                  <img
                    src={card.images?.small || "/placeholder.svg"}
                    alt={card.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>

                {/* Card Info */}
                <div className="text-center w-full mt-2 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <p
                      className="font-semibold text-base text-white break-words whitespace-normal leading-tight line-clamp-2"
                      title={card.name}
                    >
                      {card.name} {card.number ? `#${card.number}` : ""}
                    </p>
                    <p
                      className="text-sm text-gray-300 break-words whitespace-normal"
                      title={card.set?.name || ""}
                    >
                      {card.set?.name || "Unknown Set"}
                    </p>
                    {card.set?.series && (
                      <p className="text-xs text-gray-400">
                        {card.set.series}
                      </p>
                    )}
                    {card.rarity && (
                      <p className="text-xs text-blue-300">
                        {card.rarity}
                      </p>
                    )}
                  </div>
                  
                  {priceSegments.length > 0 && (
                    <p className="font-bold text-green-400 text-sm">
                      {priceSegments.join(" | ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && cards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchQuery ? `No cards found for "${searchQuery}"` : "No cards available"}
          </p>
        </div>
      )}
    </main>
  );
}
