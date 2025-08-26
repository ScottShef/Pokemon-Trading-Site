"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Header from "@/components/Header";

interface PokemonCard {
  _id: string;
  apiId: string;
  name: string;
  number?: string;
  rarity?: string;
  images?: { 
    small?: string; 
    large?: string; 
  };
  set?: { 
    id?: string;
    name?: string; 
    series?: string;
    releaseDate?: string;
  };
  highestMarketPrice?: number;
  tcgplayer?: {
    prices?: {
      normal?: { 
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
      holofoil?: { 
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
      reverseHolofoil?: { 
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
    };
    url?: string;
    updatedAt?: string;
  };
  cardmarket?: {
    url?: string;
    updatedAt?: string;
    prices?: any;
  };
  ebay?: {
    url?: string;
    updatedAt?: string;
    prices?: any;
  };
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PageProps {
  params: { id: string };
}

export default function CardPage({ params }: PageProps) {
  const router = useRouter();
  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    const fetchCard = async () => {
      try {
        setLoading(true);
        const res = await axios.get<PokemonCard>(`/api/cards/${id}`);
        setCard(res.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching card:", err);
        setError(err.response?.data?.error || "Failed to load card");
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  const formatPrice = (price?: number | null) => 
    price != null ? `$${price.toFixed(2)}` : "N/A";

  if (loading) {
    return (
      <main 
        className="min-h-screen px-6 sm:px-12 lg:px-24 pt-20"
        style={{ backgroundColor: "#1A1A1A", color: "#E5E5E5" }}
      >
        <Header />
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading card details...</p>
        </div>
      </main>
    );
  }

  if (error || !card) {
    return (
      <main 
        className="min-h-screen px-6 sm:px-12 lg:px-24 pt-20"
        style={{ backgroundColor: "#1A1A1A", color: "#E5E5E5" }}
      >
        <Header />
        <div className="text-center py-16">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Card Not Found</h1>
          <p className="text-gray-400 mb-6">{error || "The requested card could not be found."}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Card Database
          </button>
        </div>
      </main>
    );
  }

  const hasPricing = card.tcgplayer?.prices || card.highestMarketPrice;

  return (
    <main 
      className="min-h-screen px-6 sm:px-12 lg:px-24 pt-20"
      style={{ backgroundColor: "#1A1A1A", color: "#E5E5E5" }}
    >
      <Header />
      
      <div className="max-w-7xl mx-auto">
        {/* Back Button - Better positioned */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-3 font-medium shadow-lg"
          >
            <span className="text-lg">←</span> 
            <span>Back to Card Database</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Card Image */}
          <div className="space-y-6">
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-700">
              <div className="w-full max-w-[300px] mx-auto bg-[#1F1F1F] rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center" style={{ aspectRatio: '2.5/3.5' }}>
                <img
                  src={card.images?.large || card.images?.small || "/placeholder.svg"}
                  alt={card.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-[#2A2A2A] rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Highest Market Price:</span>
                  <span className="font-bold text-green-400">
                    {formatPrice(card.highestMarketPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rarity:</span>
                  <span className="font-semibold text-blue-400">
                    {card.rarity || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Card Number:</span>
                  <span className="font-semibold text-yellow-400">
                    #{card.number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Set Series:</span>
                  <span className="font-semibold text-purple-400">
                    {card.set?.series || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Card Details */}
          <div className="space-y-6">
            
            {/* Card Header */}
            <div className="bg-[#2A2A2A] rounded-xl p-6 border border-gray-700">
              <h1 className="text-3xl font-bold text-white mb-2">
                {card.name}
              </h1>
              <div className="space-y-2">
                <p className="text-xl text-gray-300">
                  {card.set?.name || "Unknown Set"}
                </p>
                {card.set?.series && (
                  <p className="text-lg text-gray-400">
                    Series: {card.set.series}
                  </p>
                )}
                {card.set?.releaseDate && (
                  <p className="text-sm text-gray-500">
                    Released: {formatDate(card.set.releaseDate)}
                  </p>
                )}
              </div>
            </div>

            {/* TCGPlayer Pricing */}
            {card.tcgplayer?.prices && (
              <div className="bg-[#2A2A2A] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">TCGPlayer Prices</h3>
                  {card.tcgplayer.updatedAt && (
                    <span className="text-xs text-gray-500">
                      Updated: {formatDate(card.tcgplayer.updatedAt)}
                    </span>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 text-gray-300">Variant</th>
                        <th className="text-right py-2 text-gray-300">Low</th>
                        <th className="text-right py-2 text-gray-300">Market</th>
                        <th className="text-right py-2 text-gray-300">High</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      {card.tcgplayer.prices.normal && (
                        <tr className="border-b border-gray-700">
                          <td className="py-3 font-medium text-gray-200">Normal</td>
                          <td className="py-3 text-right text-red-400">{formatPrice(card.tcgplayer.prices.normal.low)}</td>
                          <td className="py-3 text-right text-green-400 font-bold">{formatPrice(card.tcgplayer.prices.normal.market)}</td>
                          <td className="py-3 text-right text-blue-400">{formatPrice(card.tcgplayer.prices.normal.high)}</td>
                        </tr>
                      )}
                      {card.tcgplayer.prices.holofoil && (
                        <tr className="border-b border-gray-700">
                          <td className="py-3 font-medium text-gray-200">Holofoil</td>
                          <td className="py-3 text-right text-red-400">{formatPrice(card.tcgplayer.prices.holofoil.low)}</td>
                          <td className="py-3 text-right text-green-400 font-bold">{formatPrice(card.tcgplayer.prices.holofoil.market)}</td>
                          <td className="py-3 text-right text-blue-400">{formatPrice(card.tcgplayer.prices.holofoil.high)}</td>
                        </tr>
                      )}
                      {card.tcgplayer.prices.reverseHolofoil && (
                        <tr className="border-b border-gray-700">
                          <td className="py-3 font-medium text-gray-200">Reverse Holo</td>
                          <td className="py-3 text-right text-red-400">{formatPrice(card.tcgplayer.prices.reverseHolofoil.low)}</td>
                          <td className="py-3 text-right text-green-400 font-bold">{formatPrice(card.tcgplayer.prices.reverseHolofoil.market)}</td>
                          <td className="py-3 text-right text-blue-400">{formatPrice(card.tcgplayer.prices.reverseHolofoil.high)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {card.tcgplayer.url && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <a
                      href={card.tcgplayer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                    >
                      <span>View on TCGPlayer</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Additional Pricing Sources */}
            {(card.cardmarket || card.ebay) && (
              <div className="bg-[#2A2A2A] rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Other Market Data</h3>
                <div className="space-y-4">
                  {card.cardmarket && (
                    <div className="p-4 bg-[#1F1F1F] rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-200">Cardmarket</h4>
                        {card.cardmarket.updatedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(card.cardmarket.updatedAt)}
                          </span>
                        )}
                      </div>
                      {card.cardmarket.url && (
                        <a
                          href={card.cardmarket.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                        >
                          View on Cardmarket ↗
                        </a>
                      )}
                    </div>
                  )}
                  
                  {card.ebay && (
                    <div className="p-4 bg-[#1F1F1F] rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-200">eBay</h4>
                        {card.ebay.updatedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(card.ebay.updatedAt)}
                          </span>
                        )}
                      </div>
                      {card.ebay.url && (
                        <a
                          href={card.ebay.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                        >
                          View on eBay ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meta Information */}
            <div className="bg-[#2A2A2A] rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Database Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">API ID:</span>
                  <span className="font-mono text-gray-300">{card.apiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Set ID:</span>
                  <span className="font-mono text-gray-300">{card.set?.id || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-gray-300">{formatDate(card.lastUpdated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Added to Database:</span>
                  <span className="text-gray-300">{formatDate(card.createdAt)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
