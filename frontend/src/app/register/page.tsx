"use client"; // Enables client-side React code in Next.js app router

import { useState, FormEvent } from "react";
import axios from "axios";

// Define the shape of our registration form
interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  // State to store form input values
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
  });

  // State to display error or success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input changes and update form state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setError("");       // Clear previous errors
    setSuccess("");     // Clear previous success messages

    try {
      // Send POST request to backend API
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        form
      );

      // Display success message returned from backend
      setSuccess(res.data.message);

      // Clear the form inputs after successful registration
      setForm({ username: "", email: "", password: "" });
    } catch (err: any) {
      // Display error returned from backend or a default message
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <main className="flex justify-center items-center h-screen bg-gray-100">
      {/* Form container */}
      <form
        onSubmit={handleSubmit} // Handle form submission
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        {/* Page title */}
        <h1 className="text-2xl font-bold mb-4 text-center">
          Create Account
        </h1>

        {/* Display messages */}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-500 mb-2">{success}</p>}

        {/* Username input with label */}
        <label className="block mb-4">
          <span className="font-semibold">Username:</span>
          <input
            type="text"
            name="username"
            value={form.username}        // Controlled input
            onChange={handleChange}     // Update state as user types
            required                     // HTML5 required validation
            className="mt-1 w-full p-2 border rounded"
            placeholder="Enter your username"
          />
        </label>

        {/* Email input with label */}
        <label className="block mb-4">
          <span className="font-semibold">Email:</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border rounded"
            placeholder="Enter your email"
          />
        </label>

        {/* Password input with label */}
        <label className="block mb-6">
          <span className="font-semibold">Password:</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border rounded"
            placeholder="Enter your password"
          />
        </label>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>
      </form>
    </main>
  );
}
