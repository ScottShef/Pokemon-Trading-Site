
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateListingPage() {
  const [formData, setFormData] = useState({
    cardName: '',
    description: '',
    price: '',
    condition: 'Mint',
  });
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      if (side === 'front') {
        setFrontImage(e.target.files[0]);
      } else {
        setBackImage(e.target.files[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle file uploads to a service like Cloudinary or S3 here,
    // get back the URLs, and then submit everything to your backend API.
    
    console.log("Form Data:", formData);
    console.log("Front Image:", frontImage);
    console.log("Back Image:", backImage);

    // Placeholder for API submission logic
    alert('Listing created (prototype)! Check the console for data.');
    // router.push('/'); // Navigate back to home after successful submission
  };

  return (
    <main className="p-6 min-h-screen bg-[#343541] text-[#ECECF1] flex justify-center items-center">
      <div className="w-full max-w-2xl bg-[#2C2C38] p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Create a New Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-300 mb-1">Card Name</label>
            <input
              type="text"
              name="cardName"
              id="cardName"
              value={formData.cardName}
              onChange={handleChange}
              placeholder="e.g., Charizard VMAX"
              required
              className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              id="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Any details about the card, its history, or specific features."
              className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300"
            />
          </div>
          
          <div className="flex gap-6">
            <div className="flex-1">
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 120.00"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
              <select
                name="condition"
                id="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-md text-gray-800 bg-gray-100 border border-gray-300"
              >
                <option>Mint</option>
                <option>Near Mint</option>
                <option>Lightly Played</option>
                <option>Heavily Played</option>
                <option>PSA10</option>
                <option>PSA9</option>
                <option>PSA8</option>
                <option>PSA7</option>
                {/* Add other conditions as needed */}
              </select>
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-300 mb-2">Card Images (Required)</p>
            <div className="flex gap-6">
                <div className="flex-1">
                    <label htmlFor="frontImage" className="cursor-pointer block w-full text-center p-4 border-2 border-dashed border-gray-500 rounded-lg hover:border-blue-500">
                        {frontImage ? `Selected: ${frontImage.name}` : "Upload Front of Card"}
                    </label>
                    <input id="frontImage" type="file" onChange={(e) => handleFileChange(e, 'front')} className="hidden" accept="image/*" required />
                </div>
                <div className="flex-1">
                    <label htmlFor="backImage" className="cursor-pointer block w-full text-center p-4 border-2 border-dashed border-gray-500 rounded-lg hover:border-blue-500">
                        {backImage ? `Selected: ${backImage.name}` : "Upload Back of Card"}
                    </label>
                    <input id="backImage" type="file" onChange={(e) => handleFileChange(e, 'back')} className="hidden" accept="image/*" required />
                </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
          >
            Create Listing
          </button>
        </form>
      </div>
    </main>
  );
}

