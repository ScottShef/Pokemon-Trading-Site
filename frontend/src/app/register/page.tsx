"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");

  // Validate fields in real-time
  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "username":
        if (!value.trim()) error = "Username is required";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value))
          error = "Invalid email format";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6) error = "Password must be at least 6 characters";
        break;
      case "confirmPassword":
        if (!value) error = "Please confirm your password";
        else if (value !== form.password) error = "Passwords do not match";
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validateField(name, value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Final validation
    Object.entries(form).forEach(([name, value]) => validateField(name, value));
    if (Object.values(errors).some((err) => err)) return;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      setMessage(res.data.message || "Registered successfully!");
      setForm({ username: "", email: "", password: "", confirmPassword: "" });
      setErrors({});
    } catch (err: any) {
      // Show exact backend error for debugging
      setMessage(err.response?.data?.error || "Something went wrong");
      console.error("Backend error:", err.response?.data);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc" }}>
      <h1 style={{ textAlign: "center" }}>Create Account</h1>

      {message && <p style={{ color: message.includes("success") ? "green" : "red", textAlign: "center" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        {/* Username */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="username" style={{ fontWeight: "bold", display: "block" }}>Username:</label>
          <input
            type="text"
            name="username"
            id="username"
            value={form.username}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Enter your username"
          />
          {errors.username && <p style={{ color: "red", fontSize: "12px" }}>{errors.username}</p>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email" style={{ fontWeight: "bold", display: "block" }}>Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            value={form.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Enter your email"
          />
          {errors.email && <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password" style={{ fontWeight: "bold", display: "block" }}>Password:</label>
          <input
            type="password"
            name="password"
            id="password"
            value={form.password}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Enter your password"
          />
          {errors.password && <p style={{ color: "red", fontSize: "12px" }}>{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="confirmPassword" style={{ fontWeight: "bold", display: "block" }}>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && <p style={{ color: "red", fontSize: "12px" }}>{errors.confirmPassword}</p>}
        </div>

        <button type="submit" style={{ width: "100%", padding: "10px", fontWeight: "bold", backgroundColor: "#0070f3", color: "#fff", border: "none" }}>
          Register
        </button>
      </form>
    </div>
  );
}
