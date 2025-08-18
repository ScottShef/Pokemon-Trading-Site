
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// --- (Constants and Type Definitions remain the same) ---
const RAW_CONDITIONS = ['Mint', 'Near Mint', 'Lightly Played', 'Heavily Played'];
const GRADING_COMPANIES = ['PSA', 'CGC', 'Beckett'];
const GRADE_OPTIONS = {
  PSA: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
  CGC: ['Pristine 10', 'Gem Mint 10', 'Mint+ 9.5', 'Mint 9', 'Near Mint/Mint+ 8.5', 'Near Mint/Mint 8', 'Near Mint+ 7.5', 'Near Mint 7', 'Excellent/Near Mint+ 6.5', 'Excellent/Near Mint 6', 'Very Good/Excellent+ 5.5', 'Very Good/Excellent 5', 'Very Good+ 4.5', 'Very Good 4', 'Good/Very Good+ 3.5', 'Good/Very Good 3', 'Good+ 2.5', 'Good 2', 'Fair 1.5', 'Poor 1'],
  Beckett: ['Black Label 10', 'Pristine 10', 'Gem Mint 9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1'],
};


export default function CreateListingPage() {
  const router = useRouter();
  // ... (All your state definitions remain the same)
  const [cardName, setCardName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'raw' | 'graded'>('raw');
  const [rawCondition, setRawCondition] = useState('Mint');
  const [gradedCompany, setGradedCompany] = useState<'PSA' | 'CGC' | 'Beckett'>('PSA');
  const [gradedGrade, setGradedGrade] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableGrades = useMemo(() => GRADE_OPTIONS[gradedCompany] || [], [gradedCompany]);

  useEffect(() => {
    if (availableGrades.length > 0) {
        setGradedGrade(availableGrades[0]);
    }
  }, [availableGrades]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    // ... (This function remains the same)
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (side === 'front') {
      setFrontImage(file);
      setFrontImagePreview(previewUrl);
    } else {
      setBackImage(file);
      setBackImagePreview(previewUrl);
    }
  };

  useEffect(() => {
    // ... (This function remains the same)
    return () => {
        if (frontImagePreview) URL.revokeObjectURL(frontImagePreview);
        if (backImagePreview) URL.revokeObjectURL(backImagePreview);
    };
  }, [frontImagePreview, backImagePreview]);


  // --- handleSubmit (Corrected) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Get the authentication token from local storage
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a listing.');
      return;
    }

    if (!frontImage || !backImage) {
      setError('Please upload images for both the front and back of the card.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    // 2. Construct FormData (your existing logic is correct)
    const formData = new FormData();
    formData.append('cardName', cardName);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('listingType', listingType);

    if (listingType === 'raw') {
      formData.append('rawCondition', rawCondition);
    } else {
      formData.append('gradedData', JSON.stringify({
        company: gradedCompany,
        grade: gradedGrade,
      }));
    }
    formData.append('images', frontImage);
    formData.append('images', backImage);

    try {
      // 3. Make the POST request with the full URL and auth header
      const response = await axios.post(
        'http://localhost:5000/api/listings', // FIX: Use the full backend URL
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token // FIX: Send the token in the headers
          },
        }
      );

      alert('Listing created successfully!');
      router.push('/');

    } catch (err: any) {
      console.error("Failed to create listing:", err);
      // Use a more specific error message from the backend if available
      setError(err.response?.data?.msg || err.response?.data?.error || 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ... (Your JSX remains exactly the same)
    <main className="p-6 min-h-screen bg-[#343541] text-[#ECECF1] flex justify-center items-center">
      <div className="w-full max-w-3xl bg-[#2C2C38] p-8 rounded-xl shadow-lg relative">

        <button 
          onClick={() => router.back()}
          className="absolute top-4 left-4 py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
        >
          &larr; Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-6">Create a New Listing</h1>

        {error && (
            <div className="bg-red-500/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-300 mb-1">Card Name</label>
            <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} required className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100" />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required step="0.01" min="0" className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100" />
          </div>

          <div className="p-4 bg-gray-700/50 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-3">Card Type</label>
            <div className="flex gap-4 mb-4">
              <button type="button" onClick={() => setListingType('raw')} className={`flex-1 py-2 rounded-md font-semibold transition ${listingType === 'raw' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}>Raw</button>
              <button type="button" onClick={() => setListingType('graded')} className={`flex-1 py-2 rounded-md font-semibold transition ${listingType === 'graded' ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}>Graded</button>
            </div>
            {listingType === 'raw' ? (
              <div>
                <label htmlFor="rawCondition" className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
                <select value={rawCondition} onChange={e => setRawCondition(e.target.value)} required className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100">
                  {RAW_CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="gradedCompany" className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                  <select value={gradedCompany} onChange={e => setGradedCompany(e.target.value as 'PSA' | 'CGC' | 'Beckett')} required className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100">
                    {GRADING_COMPANIES.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="gradedGrade" className="block text-sm font-medium text-gray-300 mb-1">Grade</label>
                  <select value={gradedGrade} onChange={e => setGradedGrade(e.target.value)} required className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100">
                    {availableGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-300 mb-2">Card Images (Required)</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label htmlFor="frontImage" className="cursor-pointer w-full h-64 flex justify-center items-center border-2 border-dashed border-gray-500 rounded-lg hover:border-blue-500 transition bg-gray-700/50">
                  {frontImagePreview ? (
                    <img src={frontImagePreview} alt="Front of card preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-400">Upload Front of Card</span>
                  )}
                </label>
                <input id="frontImage" type="file" onChange={(e) => handleFileChange(e, 'front')} className="hidden" accept="image/*" required />
              </div>
              <div className="flex-1">
                <label htmlFor="backImage" className="cursor-pointer w-full h-64 flex justify-center items-center border-2 border-dashed border-gray-500 rounded-lg hover:border-blue-500 transition bg-gray-700/50">
                  {backImagePreview ? (
                    <img src={backImagePreview} alt="Back of card preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-400">Upload Back of Card</span>
                  )}
                </label>
                <input id="backImage" type="file" onChange={(e) => handleFileChange(e, 'back')} className="hidden" accept="image/*" required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:bg-gray-500">
            {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </main>
  );
}

