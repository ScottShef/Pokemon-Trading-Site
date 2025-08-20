"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Header from "../components/Header";

interface PokemonProducts {
  _id: string;
  name: string;
  number?: string;
  images?: { small?: string; large?: string };
  set?: { name?: string };
  type?: string;
  tcgplayer?: {
    prices?: {
      normal?: { market?: number };
      holofoil?: { market?: number };
      reverseHolofoil?: { market?: number };
    };
  };
  highestMarketPrice?: number;
}
type SortOrder = "price-desc" | "price-asc";
type ItemType = "card" | "product" | "both";

export default function DatabasePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<PokemonProducts[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get("sort") as SortOrder) || "price-desc"
  );
  const [itemType, setItemType] = useState<ItemType>(
    (searchParams.get("type") as ItemType) || "card"
  );

  const fetchCards = useCallback(
    async (query: string, sort: SortOrder, type: ItemType) => {
      try {
        const res = await axios.get<PokemonProducts[]>(
          `http://localhost:5000/api/cards/search?q=${encodeURIComponent(
            query
          )}&sort=${sort}&type=${type}`
        );
        setCards(res.data);
      } catch (err) {
        console.error("Error fetching cards:", err);
        setCards([]);
      }
    },
    []
  );

  useEffect(() => {
    const query = searchParams.get("q") || "";
    const sort = (searchParams.get("sort") as SortOrder) || "price-desc";
    const type = (searchParams.get("type") as ItemType) || "card";

    setSearchQuery(query);
    setSortOrder(sort);
    setItemType(type);

    fetchCards(query, sort, type);
  }, [searchParams, fetchCards]);

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

  const handleTypeChange = (type: ItemType) => {
    setItemType(type);
    updateURLParams({ type });
  };

  return (
    <main
      className="px-6 sm:px-12 lg:px-24 py-6 min-h-screen"
      style={{ backgroundColor: "#343541", color: "#ECECF1" }}
    >
      <Header />

      {/* Banner */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Card & Product Database</h2>
        <p className="text-gray-400 text-sm">
          Search and analyze prices from across the web.
        </p>
      </div>

      {/* Search + Sort + Toggle */}
      <div className="mb-6 flex flex-col gap-4 items-center">
        <div className="flex gap-3 w-full max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search cards or products..."
            className="flex-1 px-3 py-2 rounded-md text-gray-800 bg-gray-100"
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

        <div className="flex gap-3">
          {(["card", "product", "both"] as ItemType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                itemType === t
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {t === "card" ? "Cards" : t === "product" ? "Products" : "Both"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
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
              className="p-2 rounded-xl transition-transform duration-200 transform hover:scale-105 hover:shadow-2xl bg-[#4B4B5A] flex flex-col items-center cursor-pointer h-[420px] w-[240px]"
            >
              {/* Enlarged Image */}
              <div className="w-[230px] h-[290px] flex items-center justify-center bg-[#2F2F3A] rounded-lg overflow-hidden">
                <img
                  src={card.images?.small || "/placeholder.png"}
                  alt={card.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Info Section */}
              <div className="text-center w-full mt-1 space-y-1">
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
                  {card.set?.name || ""}
                </p>
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
    </main>
  );
}
