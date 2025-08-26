"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import _ from 'lodash';
import { ICardSearchResult } from '@/types/pokemon';

const CONDITIONS = ["Mint", "Near Mint", "Excellent", "Good", "Played", "Poor"];
const GRADERS = ["PSA", "BGS", "CGC"];

export default function CreateListingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ICardSearchResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<ICardSearchResult | null>(null);
  
  // Listing details state
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [listingType, setListingType] = useState<'raw' | 'graded'>('raw');
  
  // Graded card specific state
  const [grader, setGrader] = useState('PSA');
  const [grade, setGrade] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const fetchDebounced = _.debounce(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/cards/search?q=${searchQuery}`);
        setSearchResults(res.data?.cards || []);
      } catch (err) {
        console.error("Card search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    fetchDebounced();
    return () => fetchDebounced.cancel();
  }, [searchQuery]);

  const handleSelectCard = (card: ICardSearchResult) => {
    setSelectedCard(card);
    setSearchQuery(card.name);
    setSearchResults([]);
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCard) {
      setError("Please search for and select a card first.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (listingType === 'graded' && (!grader || !grade)) {
        setError("For graded cards, please provide both the grader and the grade.");
        return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push('/login');
      return;
    }

    const listingData = {
      card_name: selectedCard.name,
      description,
      price: parseFloat(price),
      listing_type: listingType,
      image_urls: imageUrls.filter(url => url.trim() !== ''),
      graded_company: listingType === 'graded' ? grader : undefined,
      graded_grade: listingType === 'graded' ? grade : undefined,
    };

    try {
      await axios.post('/api/listings', listingData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert("Listing created successfully!");
      router.push('/marketplace');

    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error || "Failed to create listing.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-400">Create New Listing</h1>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">&larr; Back</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
          {/* Step 1: Search for a card */}
          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">1. Find Your Card</label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing a card name..."
              disabled={!!selectedCard}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {isSearching && <p className="text-sm text-gray-400 mt-1">Searching...</p>}
            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto">
                {searchResults.map(card => (
                  <li
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className="px-4 py-2 hover:bg-purple-600 cursor-pointer flex items-center gap-4"
                  >
                    <img src={card.image || ''} alt={card.name} className="w-10 h-auto" />
                    <div>
                      <p className="font-semibold">{card.name}</p>
                      <p className="text-xs text-gray-400">{card.set?.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedCard && (
            <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={selectedCard.image || ''} alt={selectedCard.name} className="w-16 h-auto rounded-md" />
                <div>
                  <p className="font-bold text-lg">{selectedCard.name}</p>
                  <p className="text-sm text-gray-300">{selectedCard.set?.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => { setSelectedCard(null); setSearchQuery(''); }} className="text-red-400 hover:text-red-300 font-semibold">Change</button>
            </div>
          )}

          {/* Step 2: Listing Details */}
          <div className="border-t border-gray-700 pt-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-300">2. Add Listing Details</h2>
            
            <div>
              <label htmlFor="listingType" className="block text-sm font-medium text-gray-300 mb-1">Listing Type</label>
              <select
                id="listingType"
                value={listingType}
                onChange={(e) => setListingType(e.target.value as 'raw' | 'graded')}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md"
              >
                <option value="raw">Raw</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            {listingType === 'graded' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700/50 rounded-md">
                <div>
                  <label htmlFor="grader" className="block text-sm font-medium text-gray-300 mb-1">Grader</label>
                  <select id="grader" value={grader} onChange={e => setGrader(e.target.value)} className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-md">
                    {GRADERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-300 mb-1">Grade</label>
                  <input id="grade" type="number" value={grade} onChange={e => setGrade(e.target.value)} min="1" max="10" placeholder="e.g., 9" className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-md" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 24.99"
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any extra details about the card..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image URLs (Optional)</label>
                {imageUrls.map((url, index) => (
                    <input
                        key={index}
                        type="text"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder="https://example.com/my-card-image.jpg"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md mb-2"
                    />
                ))}
                <button type="button" onClick={handleAddImageUrl} className="text-sm text-purple-400 hover:text-purple-300">
                    + Add another image
                </button>
            </div>
          </div>

          {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !selectedCard}
            className="w-full px-4 py-3 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </main>
  );
}

