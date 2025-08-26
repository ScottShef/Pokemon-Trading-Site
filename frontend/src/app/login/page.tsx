"use client";

import { useState, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
// Import the UserProfile type for the expected response
import { UserProfile } from "@/types/user";

// Define the structure for the API response on successful login
interface LoginResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error message on new submission

    // Basic client-side validation
    if (!identifier || !password) {
      setError("Both username/email and password are required.");
      return;
    }

    setLoading(true);

    try {
      // The API endpoint is now a relative path to our Next.js API route.
      const res = await axios.post<LoginResponse>("/api/auth/login", {
        identifier,
        password,
      });

      // On success, store the token and user info in localStorage.
      // This makes it available for subsequent authenticated requests.
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect to the marketplace page after successful login.
      router.push("/marketplace");
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      // Set a user-friendly error message from the API response.
      const errorMessage =
        axiosError.response?.data?.error ||
        "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Login failed:", axiosError.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-purple-400">
          Login to Your Account
        </h1>

        {error && (
          <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="identifier"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Username or Email
            </label>
            <input
              type="text"
              name="identifier"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="your_username or user@email.com"
              autoComplete="username"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="relative">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-400 hover:text-purple-400"
            >
              {showPassword ? (
                <HiOutlineEyeOff size={20} />
              ) : (
                <HiOutlineEye size={20} />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-400">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-purple-400 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}