"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

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

      // After successful registration
      const { token, user } = res.data;

      // Save token for authenticated requests
      localStorage.setItem("token", token);

      // Optional: save user info for immediate use
      localStorage.setItem("username", user.username);
      localStorage.setItem("email", user.email);

      // Redirect to home page
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
        <h1 style={{ textAlign: "center", fontSize: "2xl", marginBottom: "20px" }}>Create Account</h1>

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
          {/* Username */}
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="username" style={{ fontWeight: "bold", display: "block" }}>Username:</label>
            <input
              type="text"
              name="username"
              id="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#5a5c6c",
                color: "#ECECF1",
              }}
            />
            {errors.username && <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.username}</p>}
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
              placeholder="Enter your email"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#5a5c6c",
                color: "#ECECF1",
              }}
            />
            {errors.email && <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <label htmlFor="password" style={{ fontWeight: "bold", display: "block" }}>Password:</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#5a5c6c",
                color: "#ECECF1",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
              }}
            >
              {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
            {errors.password && <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <label htmlFor="confirmPassword" style={{ fontWeight: "bold", display: "block" }}>Confirm Password:</label>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#5a5c6c",
                color: "#ECECF1",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
              }}
            >
              {showConfirm ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
            {errors.confirmPassword && <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.confirmPassword}</p>}
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
            Register
          </button>

          {/* Back to Home */}
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              fontWeight: "bold",
              backgroundColor: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            &larr; Back to Home
          </button>

          {/* Already have account */}
          <p style={{ marginTop: "10px", textAlign: "center" }}>
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              style={{ color: "#10b981", cursor: "pointer", fontWeight: "bold" }}
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}