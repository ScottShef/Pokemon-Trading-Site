"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import _ from 'lodash';
import { ICardSearchResult } from '@/types/pokemon';

const RAW_CONDITIONS = ['Near Mint', 'Lightly Played','Moderately Played', 'Heavily Played'];
const GRADING_COMPANIES = ['PSA', 'CGC', 'Beckett'];
const GRADE_OPTIONS = {
  PSA: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
  CGC: ['Pristine 10', 'Gem Mint 10', 'Mint+ 9.5', 'Mint 9', 'Near Mint/Mint+ 8.5', 'Near Mint/Mint 8', 'Near Mint+ 7.5', 'Near Mint 7', 'Excellent/Near Mint+ 6.5', 'Excellent/Near Mint 6', 'Very Good/Excellent+ 5.5', 'Very Good/Excellent 5', 'Very Good+ 4.5', 'Very Good 4', 'Good/Very Good+ 3.5', 'Good/Very Good 3', 'Good+ 2.5', 'Good 2', 'Fair 1.5', 'Poor 1'],
  Beckett: ['Black Label 10', 'Pristine 10', 'Gem Mint 9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1'],
};

export default function CreateListingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ICardSearchResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<ICardSearchResult | null>(null);
  
  // Listing details state
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'raw' | 'graded'>('raw');
  
  // Raw card specific state
  const [condition, setCondition] = useState('Mint');
  
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

  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    return response.data.url;
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
    if (!frontImage || !backImage) {
      setError("Please upload both front and back images of the card.");
      return;
    }
    if (listingType === 'graded' && (!grader || !grade)) {
        setError("For graded cards, please provide both the grader and the grade.");
        return;
    }
    if (listingType === 'raw' && !condition) {
        setError("For raw cards, please select a condition.");
        return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Upload both images
      const frontImageUrl = await uploadImage(frontImage);
      const backImageUrl = await uploadImage(backImage);

      const listingData = {
        card_name: selectedCard.name,
        description,
        price: parseFloat(price),
        listing_type: listingType,
        image_urls: [frontImageUrl, backImageUrl],
        condition: listingType === 'raw' ? condition : undefined,
        graded_company: listingType === 'graded' ? grader : undefined,
        graded_grade: listingType === 'graded' ? grade : undefined,
      };

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
    <main className="min-h-screen bg-gray-900 text-white p-3 md:p-4 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-purple-400">Create New Listing</h1>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm">&larr; Back</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
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
            <div className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedCard.image || ''} alt={selectedCard.name} className="w-12 h-auto rounded-md" />
                <div>
                  <p className="font-bold text-base">{selectedCard.name}</p>
                  <p className="text-xs text-gray-300">{selectedCard.set?.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => { setSelectedCard(null); setSearchQuery(''); }} className="text-red-400 hover:text-red-300 font-semibold text-sm">Change</button>
            </div>
          )}

          {/* Step 2: Listing Details */}
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-300">2. Add Listing Details</h2>
            
            <div>
              <label htmlFor="listingType" className="block text-sm font-medium text-gray-300 mb-1">Listing Type</label>
              <select
                id="listingType"
                value={listingType}
                onChange={(e) => setListingType(e.target.value as 'raw' | 'graded')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm"
              >
                <option value="raw">Raw</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            {listingType === 'raw' && (
              <div className="p-3 bg-gray-700/50 rounded-md">
                <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
                <select 
                  id="condition" 
                  value={condition} 
                  onChange={e => setCondition(e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-sm"
                >
                  {RAW_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {listingType === 'graded' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-700/50 rounded-md">
                <div>
                  <label htmlFor="grader" className="block text-sm font-medium text-gray-300 mb-1">Grader</label>
                  <select 
                    id="grader" 
                    value={grader} 
                    onChange={e => {
                      setGrader(e.target.value);
                      setGrade(''); // Reset grade when grader changes
                    }} 
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-sm"
                  >
                    {GRADING_COMPANIES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-300 mb-1">Grade</label>
                  <select 
                    id="grade" 
                    value={grade} 
                    onChange={e => setGrade(e.target.value)} 
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-sm"
                  >
                    <option value="">Select Grade</option>
                    {GRADE_OPTIONS[grader as keyof typeof GRADE_OPTIONS]?.map(gradeOption => (
                      <option key={gradeOption} value={gradeOption}>{gradeOption}</option>
                    ))}
                  </select>
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any extra details about the card..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Card Images (Required) <span className="text-red-400">*</span>
              </label>
              
              {/* Image Upload Boxes */}
              <div className="grid grid-cols-2 gap-3">
                {/* Front Image Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontImageChange}
                    className="hidden"
                    id="front-image-upload"
                    required
                  />
                  <label
                    htmlFor="front-image-upload"
                    className={`
                      relative block w-full h-36 border-2 border-dashed border-gray-600 rounded-lg 
                      cursor-pointer transition-all duration-200 
                      ${frontImagePreview ? 'border-purple-500 bg-purple-900/20' : 'hover:border-purple-400 hover:bg-gray-700/50'}
                      group
                    `}
                  >
                    {frontImagePreview ? (
                      <div className="relative h-full">
                        <img 
                          src={frontImagePreview} 
                          alt="Front preview" 
                          className="w-full h-full object-contain rounded-lg" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white font-medium text-sm">Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-purple-300 transition-colors">
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">Front of Card</span>
                        <span className="text-xs mt-1">Click to upload</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Back Image Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackImageChange}
                    className="hidden"
                    id="back-image-upload"
                    required
                  />
                  <label
                    htmlFor="back-image-upload"
                    className={`
                      relative block w-full h-36 border-2 border-dashed border-gray-600 rounded-lg 
                      cursor-pointer transition-all duration-200 
                      ${backImagePreview ? 'border-purple-500 bg-purple-900/20' : 'hover:border-purple-400 hover:bg-gray-700/50'}
                      group
                    `}
                  >
                    {backImagePreview ? (
                      <div className="relative h-full">
                        <img 
                          src={backImagePreview} 
                          alt="Back preview" 
                          className="w-full h-full object-contain rounded-lg" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white font-medium text-sm">Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-purple-300 transition-colors">
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">Back of Card</span>
                        <span className="text-xs mt-1">Click to upload</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 text-center">
                Supported formats: JPG, PNG, GIF (max 5MB each)
              </p>
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

