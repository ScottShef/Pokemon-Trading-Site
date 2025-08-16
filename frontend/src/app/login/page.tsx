"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface LoginForm {
  identifier: string; // username or email
  password: string;
}

interface ValidationErrors {
  identifier?: string;
  password?: string;
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");
  const router = useRouter(); // Next.js router

  // Validate fields in real-time
  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "identifier" && !value.trim()) error = "Username or Email is required";
    if (name === "password" && !value) error = "Password is required";
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
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifier: form.identifier,
        password: form.password,
      });

      setMessage(res.data.message || "Login successful!");
      setForm({ identifier: "", password: "" });
      setErrors({});

      // Redirect to homepage after successful login
      router.push("/");

    } catch (err: any) {
      setMessage(err.response?.data?.error || "Something went wrong");
      console.error("Backend error:", err.response?.data);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#343541",
        color: "#ECECF1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "30px",
          borderRadius: "12px",
          backgroundColor: "#444654",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <h1 style={{ textAlign: "center", fontSize: "2xl", marginBottom: "20px" }}>
          Login
        </h1>

        {message && (
          <p
            style={{
              color: message.toLowerCase().includes("success") ? "#4ade80" : "#f87171",
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username or Email */}
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="identifier" style={{ fontWeight: "bold", display: "block" }}>
              Username or Email:
            </label>
            <input
              type="text"
              name="identifier"
              id="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Enter username or email"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#5a5c6c",
                color: "#ECECF1",
              }}
            />
            {errors.identifier && <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.identifier}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="password" style={{ fontWeight: "bold", display: "block" }}>
              Password:
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#5a5c6c",
                color: "#ECECF1",
              }}
            />
            {errors.password && <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              fontWeight: "bold",
              backgroundColor: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
