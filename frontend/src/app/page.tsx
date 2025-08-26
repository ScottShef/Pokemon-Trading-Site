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
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("price-desc");
  const [totalCards, setTotalCards] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCards = useCallback(
    async (query: string, sort: SortOrder, page: number = 1, append: boolean = false) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const offset = (page - 1) * 50;
        const res = await axios.get<{
          data: PokemonCard[];
          total: number;
          page: number;
          hasMore: boolean;
        }>(`/api/cards?q=${encodeURIComponent(query)}&sort=${sort}&limit=50&offset=${offset}`);
        
        if (append) {
          setCards(prev => [...prev, ...res.data.data]);
        } else {
          setCards(res.data.data);
          setCurrentPage(1);
        }
        setTotalCards(res.data.total);
        setHasMore(res.data.hasMore);
      } catch (err) {
        console.error("Error fetching cards:", err);
        if (!append) {
          setCards([]);
          setTotalCards(0);
        }
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    []
  );

  const loadMoreCards = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCards(searchQuery, sortOrder, nextPage, true);
    }
  }, [currentPage, hasMore, loadingMore, searchQuery, sortOrder, fetchCards]);

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
    setCurrentPage(1);
    setHasMore(true);

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
      className="px-6 sm:px-12 lg:px-24 pt-20 min-h-screen"
      style={{ backgroundColor: "#1A1A1A", color: "#E5E5E5" }}
    >
      <Header />

      {/* Banner */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-100">Pokemon Card Collection</h2>
        <p className="text-gray-500 text-xs">
          Browse and search through {totalCards.toLocaleString()} Pokemon cards from our database
        </p>
      </div>

      {/* Search + Sort */}
      <div className="mb-4 flex flex-col gap-2 items-center">
        <div className="flex gap-2 w-full max-w-4xl mx-auto justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search cards by name, set, or number..."
            className="flex-1 min-w-[400px] px-4 py-1 rounded-md text-gray-200 bg-gray-800 border border-gray-600 placeholder-gray-400 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="w-40 px-2 py-1 rounded-md text-gray-200 bg-gray-800 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="price-desc">Price: High → Low</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="name">Name: A → Z</option>
          </select>
          <button onClick={() => router.push("/marketplace")} className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm">Marketplace</button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading cards...</p>
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
                className="p-2 rounded-xl transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl bg-[#2A2A2A] border border-gray-700 flex flex-col items-center cursor-pointer h-[450px] w-[240px]"
              >
                {/* Card Image */}
                <div className="w-[230px] h-[290px] flex items-center justify-center bg-[#1F1F1F] border border-gray-600 rounded-lg overflow-hidden">
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
                      className="font-semibold text-base text-gray-100 break-words whitespace-normal leading-tight line-clamp-2"
                      title={card.name}
                    >
                      {card.name} {card.number ? `#${card.number}` : ""}
                    </p>
                    <p
                      className="text-sm text-gray-400 break-words whitespace-normal"
                      title={card.set?.name || ""}
                    >
                      {card.set?.name || "Unknown Set"}
                    </p>
                    {card.set?.series && (
                      <p className="text-xs text-gray-500">
                        {card.set.series}
                      </p>
                    )}
                    {card.rarity && (
                      <p className="text-xs text-blue-400">
                        {card.rarity}
                      </p>
                    )}
                  </div>
                  
                  {priceSegments.length > 0 && (
                    <p className="font-bold text-green-500 text-sm">
                      {priceSegments.join(" | ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {!loading && cards.length > 0 && hasMore && (
        <div className="text-center py-8">
          <button
            onClick={loadMoreCards}
            disabled={loadingMore}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? "Loading..." : "Load More Cards"}
          </button>
        </div>
      )}

      {/* Cards Count Info */}
      {!loading && cards.length > 0 && (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">
            Showing {cards.length.toLocaleString()} of {totalCards.toLocaleString()} cards
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && cards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchQuery ? `No cards found for "${searchQuery}"` : "No cards available"}
          </p>
        </div>
      )}
    </main>
  );
}
