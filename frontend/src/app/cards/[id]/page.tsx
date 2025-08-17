"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Textfit } from "react-textfit";
import axios from "axios";

interface PriceStats {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  directLow?: number;
  averageSellPrice?: number;
  trendPrice?: number;
  reverseHoloTrend?: number;
  lowPrice?: number;
  reverseHoloLow?: number;
}

interface PokemonCard {
  _id: string;
  apiId: string;
  name: string;
  number?: string;
  rarity?: string;
  images?: { small?: string; large?: string };
  set?: { id?: string; name?: string; series?: string; releaseDate?: string };
  cardmarket?: { url?: string; updatedAt?: string; prices?: PriceStats };
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: {
      normal?: PriceStats;
      holofoil?: PriceStats;
      reverseHolofoil?: PriceStats;
    };
  };
  ebay?: {
    updatedAt?: string;
    prices?: Record<string, { grade?: string; average?: number; count?: number; url?: string }>;
  };
  lastUpdated?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CardPage({ params }: PageProps) {
  const router = useRouter();
  const [card, setCard] = useState<PokemonCard | null>(null);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const getId = async () => {
      const unwrappedParams = await params;
      setId(unwrappedParams.id);
    };
    getId();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const fetchCard = async () => {
      try {
        const res = await axios.get<PokemonCard>(`http://localhost:5000/api/cards/${id}`);
        setCard(res.data);
      } catch (err) {
        console.error("Error fetching card:", err);
      }
    };
    fetchCard();
  }, [id]);

  if (!card) return <p>Loading...</p>;

  const formatPrice = (price?: number) => (price !== undefined ? `$${price.toFixed(2)}` : "-");

  const renderPriceRow = (label: string, stats?: PriceStats) => {
    if (!stats) return null;
    return (
      <tr className="border-b border-gray-700">
        <td className="px-2 py-1 font-medium">{label}</td>
        <td className="px-2 py-1">{formatPrice(stats.low)}</td>
        <td className="px-2 py-1">{formatPrice(stats.mid)}</td>
        <td className="px-2 py-1">{formatPrice(stats.high)}</td>
        <td className="px-2 py-1">{formatPrice(stats.market)}</td>
      </tr>
    );
  };

  return (
    <main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow transition"
      >
        &larr; Back
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Card Image */}
        <img
          src={card.images?.large || card.images?.small || "/placeholder.png"}
          alt={card.name}
          className="w-64 h-auto rounded-lg shadow-lg"
        />

        {/* Card Details and Price Table */}
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          {/* Left: Basic Details */}
          <div className="flex-1 flex flex-col gap-3">
            <Textfit mode="single" max={28} min={18} className="font-bold text-white">
              {card.name} #{card.number}
            </Textfit>
            {card.rarity && <p className="text-gray-300">{card.rarity}</p>}
            {card.set && (
              <p className="text-gray-300">
                {card.set.name} • {card.set.series} • {card.set.releaseDate?.split("T")[0]}
              </p>
            )}
            <p className="text-gray-400 text-sm">
              Last Updated: {card.lastUpdated?.split("T")[0] || "-"}
            </p>
          </div>

          {/* Right: Price Info */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Average Card Price */}
            {card.cardmarket?.prices?.averageSellPrice && (
              <p className="text-yellow-400 font-bold text-lg">
                Average Price: ${card.cardmarket.prices.averageSellPrice.toFixed(2)}
              </p>
            )}

            {/* TCGPlayer Price Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-2 py-1 text-left">Source</th>
                    <th className="px-2 py-1">Low</th>
                    <th className="px-2 py-1">Mid</th>
                    <th className="px-2 py-1">High</th>
                    <th className="px-2 py-1">Market</th>
                  </tr>
                </thead>
                <tbody>
                  {renderPriceRow("TCGPlayer Normal", card.tcgplayer?.prices?.normal)}
                  {renderPriceRow("TCGPlayer Holofoil", card.tcgplayer?.prices?.holofoil)}
                  {renderPriceRow("TCGPlayer Reverse Holo", card.tcgplayer?.prices?.reverseHolofoil)}
                </tbody>
              </table>
            </div>

            {/* eBay Price Table */}
            {card.ebay?.prices && (
              <div className="overflow-x-auto mt-4">
                <h3 className="text-white font-semibold mb-2">eBay Prices</h3>
                <table className="w-full table-auto border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-2 py-1 text-left">Grade</th>
                      <th className="px-2 py-1">Average</th>
                      <th className="px-2 py-1">Count</th>
                      <th className="px-2 py-1">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(card.ebay.prices).map(([grade, data]) => (
                      <tr key={grade} className="border-b border-gray-700">
                        <td className="px-2 py-1">{grade}</td>
                        <td className="px-2 py-1">{formatPrice(data.average)}</td>
                        <td className="px-2 py-1">{data.count ?? "-"}</td>
                        <td className="px-2 py-1">
                          {data.url ? (
                            <a
                              href={data.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              Link
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
