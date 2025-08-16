"use client"; // Required for Next.js app router to use client-side React

import { useState, FormEvent } from "react";
import axios from "axios"; // HTTP client to make requests to backend

// Define the shape of the registration form data
interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  // React state to hold form inputs
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
  });

  // State to display error or success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update form state when user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    setError("");        // Reset error messages
    setSuccess("");      // Reset success messages

    try {
      // Send POST request to backend register route
      const res = await axios.post("http://localhost:5000/api/auth/register", form);

      // Show success message from backend
      setSuccess(res.data.message);

      // Clear form after successful registration
      setForm({ username: "", email: "", password: "" });
    } catch (err: any) {
      // Show error returned from backend or generic error
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <main className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit} // Connect form submit to handleSubmit function
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        {/* Page title */}
        <h1 className="text-2xl font-bold mb-4 text-center">Create Account</h1>

        {/* Display error or success messages */}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-500 mb-2">{success}</p>}

        {/* Username input */}
        <label className="block mb-2">
          Username
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange} // Update state on change
            required
            className="mt-1 w-full p-2 border rounded"
          />
        </label>

        {/* Email input */}
        <label className="block mb-2">
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border rounded"
          />
        </label>

        {/* Password input */}
        <label className="block mb-4">
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border rounded"
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
