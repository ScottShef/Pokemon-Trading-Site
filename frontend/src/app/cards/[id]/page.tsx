"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { IPokemonCard, IPriceData } from "@/types/pokemon";

interface PageProps {
  params: { id: string };
}

export default function CardPage({ params }: PageProps) {
  const router = useRouter();
  const [card, setCard] = useState<IPokemonCard | null>(null);
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    const fetchCard = async () => {
      try {
        const res = await axios.get<IPokemonCard>(`/api/cards/${id}`);
        setCard(res.data);
      } catch (err) {
        console.error("Error fetching card:", err);
      }
    };

    fetchCard();
  }, [id]);

  if (!card) {
    return (
      <main className="p-6 min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Loading card data...</p>
      </main>
    );
  }

  const formatDate = (dateString?: string | null) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "-";
  };

  const formatPrice = (price?: number | null) => (price != null ? `$${price.toFixed(2)}` : "-");

  const renderPriceRow = (label: string, stats?: IPriceData) => {
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
    <main className="p-6 min-h-screen bg-gray-900 text-gray-100">
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow transition"
      >
        &larr; Back
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={card.images?.large || card.images?.small || "/placeholder.png"}
          alt={card.name}
          className="w-full md:w-1/3 lg:w-1/4 h-auto object-contain rounded-lg shadow-lg"
        />

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 flex flex-col gap-3">
            <h1 className="font-bold text-white text-2xl md:text-3xl truncate">
              {card.name} #{card.number}
            </h1>
            {card.rarity && <p className="text-gray-300 text-lg">{card.rarity}</p>}
            {card.set && (
              <p className="text-gray-300">
                {card.set.name} • {card.set.series} • Released: {formatDate(card.set.releaseDate)}
              </p>
            )}
            <p className="text-gray-400 text-sm">
              Last Updated: {formatDate(card.lastUpdated)}
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {card.cardmarket?.prices?.averageSellPrice && (
              <p className="text-yellow-400 font-bold text-2xl">
                Average Price: ${card.cardmarket.prices.averageSellPrice.toFixed(2)}
              </p>
            )}

            {card.tcgplayer && (
              <div className="overflow-x-auto">
                <h3 className="text-white font-semibold mb-2">TCGPlayer Prices</h3>
                <table className="w-full table-auto border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-2 py-1 text-left">Type</th>
                      <th className="px-2 py-1">Low</th>
                      <th className="px-2 py-1">Mid</th>
                      <th className="px-2 py-1">High</th>
                      <th className="px-2 py-1">Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderPriceRow("Normal", card.tcgplayer.prices?.normal)}
                    {renderPriceRow("Holofoil", card.tcgplayer.prices?.holofoil)}
                    {renderPriceRow("Reverse Holo", card.tcgplayer.prices?.reverseHolofoil)}
                  </tbody>
                </table>
              </div>
            )}

            {card.ebay?.prices && Object.keys(card.ebay.prices).length > 0 && (
              <div className="overflow-x-auto mt-4">
                <h3 className="text-white font-semibold mb-2">Recent eBay Sales</h3>
                <table className="w-full table-auto border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-2 py-1 text-left">Grade</th>
                      <th className="px-2 py-1">Average Price</th>
                      <th className="px-2 py-1">Sales Count</th>
                      <th className="px-2 py-1">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(card.ebay.prices).map(([grade, data]) => (
                      <tr key={grade} className="border-b border-gray-700">
                        <td className="px-2 py-1">{grade}</td>
                        <td className="px-2 py-1">{formatPrice(data.stats?.average)}</td>
                        <td className="px-2 py-1">{data.stats?.count ?? "-"}</td>
                        <td className="px-2 py-1">
                          {data.url ? (
                            <a
                              href={data.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              View
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
