"use client";

import { useState, useEffect } from "react";
import axios from "axios";

type Tab = "listings" | "watchlist" | "reviews" | "purchases" | "profileSettings";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");

  // Navigate back to home
  const handleBackHome = () => {
    window.location.href = "/";
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "#343541", color: "#ECECF1" }}
    >
      {/* Back to Home Button */}
      <button
        onClick={handleBackHome}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
      >
        &larr; Back to Home
      </button>

      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-600">
        <TabButton
          label="Current Listings"
          tab="listings"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          label="Watchlist"
          tab="watchlist"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          label="Reviews"
          tab="reviews"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          label="Purchases"
          tab="purchases"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          label="Profile Settings"
          tab="profileSettings"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className="p-4 rounded-xl shadow" style={{ backgroundColor: "#444654" }}>
        {activeTab === "listings" && <CurrentListings />}
        {activeTab === "watchlist" && <Watchlist />}
        {activeTab === "reviews" && <Reviews />}
        {activeTab === "purchases" && <Purchases />}
        {activeTab === "profileSettings" && <ProfileSettings />}
      </div>
    </div>
  );
}

// --------------------
// Tab Button Component
// --------------------
interface TabButtonProps {
  label: string;
  tab: Tab;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

function TabButton({ label, tab, activeTab, setActiveTab }: TabButtonProps) {
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-t-lg font-semibold transition ${
        activeTab === tab
          ? "bg-gray-700 text-white"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

// --------------------
// Tab Content Components (placeholders)
// --------------------
function CurrentListings() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Current Listings</h2>
      <p>Your active listings will be displayed here.</p>
    </div>
  );
}

function Watchlist() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Watchlist</h2>
      <p>Items you are watching will appear here.</p>
    </div>
  );
}

function Reviews() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Reviews</h2>
      <p>Your reviews and ratings will be displayed here.</p>
    </div>
  );
}

function Purchases() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Purchases</h2>
      <p>History of items you have bought will appear here.</p>
    </div>
  );
}

// --------------------
// Profile Settings Tab
// --------------------
function ProfileSettings() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // Toggle password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsername(res.data.user.username);
        setEmail(res.data.user.email);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to update password");
      console.error(err.response?.data);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Profile Settings</h2>

      <div className="mb-4">
        <p><strong>Username:</strong> {username}</p>
        <p><strong>Email:</strong> {email}</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-3">
        {/* Current Password */}
        <div>
          <label className="block font-semibold">Current Password:</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2 top-2 text-gray-300 hover:text-white"
            >
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block font-semibold">New Password:</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-2 text-gray-300 hover:text-white"
            >
              {showNew ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block font-semibold">Confirm New Password:</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="Re-enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 top-2 text-gray-300 hover:text-white"
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Update Password
        </button>
      </form>

      {message && (
        <p className="mt-3" style={{ color: message.includes("success") ? "green" : "red" }}>
          {message}
        </p>
      )}
    </div>
  );
}

