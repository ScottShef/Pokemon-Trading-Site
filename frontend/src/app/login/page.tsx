"use client";

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

interface LoginForm {
  identifier: string;
  password: string;
}

interface ValidationErrors {
  identifier?: string;
  password?: string;
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({ identifier: "", password: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Refs to inputs for detecting autofill
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Sync React state with autofilled values
  useEffect(() => {
    if (identifierRef.current && identifierRef.current.value) {
      setForm((prev) => ({ ...prev, identifier: identifierRef.current!.value }));
    }
    if (passwordRef.current && passwordRef.current.value) {
      setForm((prev) => ({ ...prev, password: passwordRef.current!.value }));
    }
  }, []);

  // Validate form fields
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

    // Make sure we get the latest values from refs (autofill workaround)
    const identifier = identifierRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    setForm({ identifier, password });

    Object.entries({ identifier, password }).forEach(([name, value]) => validateField(name, value));
    if (!identifier || !password || Object.values(errors).some((err) => err)) return;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifier,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username);

      setMessage(res.data.message || "Login successful!");
      setForm({ identifier: "", password: "" });
      setErrors({});

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
        <h1 style={{ textAlign: "center", fontSize: "2xl", marginBottom: "20px" }}>Login</h1>

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
              ref={identifierRef}
              type="text"
              name="identifier"
              id="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Enter username or email"
              autoComplete="username"
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
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <label htmlFor="password" style={{ fontWeight: "bold", display: "block" }}>
              Password:
            </label>
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
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

          <p style={{ marginTop: "10px", textAlign: "center" }}>
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/register")}
              style={{ color: "#10b981", cursor: "pointer", fontWeight: "bold" }}
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}