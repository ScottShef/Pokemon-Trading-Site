"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Textfit } from "react-textfit";

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

export default function CardPage() {
  const { id } = useParams();
  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const res = await axios.get<PokemonCard>(`http://localhost:5000/api/cards/${id}`);
        setCard(res.data);
      } catch (err) {
        console.error("Error fetching card:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCard();
  }, [id]);

  if (loading) return <p className="text-center mt-20 text-white">Loading...</p>;
  if (!card) return <p className="text-center mt-20 text-white">Card not found.</p>;

  return (
<main className="p-6 min-h-screen" style={{ backgroundColor: "#343541", color: "#ECECF1" }}>
  <div
    className="p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-6"
    style={{ backgroundColor: "#4B4B5A" }}
  >
    {/* Card Image */}
    <img
      src={card.images?.large || card.images?.small || "/placeholder.png"}
      alt={card.name}
      style={{
        width: "300px",
        height: "420px",
        objectFit: "cover",
        borderRadius: "8px",
        boxShadow: "0 6px 12px rgba(0,0,0,0.4)",
      }}
    />

    {/* Card Details */}
    <div className="flex-1 flex flex-col justify-start">
      <h1 className="text-3xl font-bold mb-3">
        {card.name} #{card.number}
      </h1>

      <p className="text-xl mb-2">
        Set: <span className="font-semibold">{card.set?.name || "N/A"}</span>
      </p>

      <p className="text-xl mb-2">
        Series: <span className="font-semibold">{card.set?.series || "N/A"}</span>
      </p>

      <p className="text-xl mb-2">
        Release Date:{" "}
        <span className="font-semibold">
          {card.set?.releaseDate ? card.set.releaseDate.split("T")[0] : "N/A"}
        </span>
      </p>

      <p className="text-2xl font-bold mt-4" style={{ color: "#FFD700" }}>
        ${card.cardmarket?.prices?.averageSellPrice?.toFixed(2) || "N/A"}
      </p>

      <p className="text-lg mt-2">
        Rarity: <span className="font-semibold">{card.rarity || "N/A"}</span>
      </p>
    </div>
  </div>
</main>

  );
}
