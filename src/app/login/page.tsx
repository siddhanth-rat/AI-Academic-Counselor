"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "COUNSELOR">("STUDENT");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isRegistering) {
        // 1. Call backend API to register user in database
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, countryOfOrigin, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
      }

      // 2. Authenticate user using NextAuth
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password.");
      }

      // 3. Redirect based on role
      if (role === "COUNSELOR") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEDED] dark:bg-[#121212] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#066AC9] text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            G
          </div>
          <h1 className="text-2xl font-bold text-[#1F2022] dark:text-white">
            {isRegistering ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRegistering ? "Register to start your study abroad journey" : "Sign in to your Admission Portal"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Role Toggle Switch */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole("STUDENT")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              role === "STUDENT"
                ? "bg-white dark:bg-[#2C2C2C] text-[#066AC9] shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Student Portal
          </button>
          <button
            type="button"
            onClick={() => { setRole("COUNSELOR"); setIsRegistering(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              role === "COUNSELOR"
                ? "bg-[#066AC9] text-white shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Staff Portal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white focus:outline-none focus:border-[#066AC9] text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
              {role === "STUDENT" ? "Student Email" : "Staff Email"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === "STUDENT" ? "student@university.edu" : "staff@institution.com"}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white focus:outline-none focus:border-[#066AC9] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white focus:outline-none focus:border-[#066AC9] text-sm"
            />
          </div>

          {isRegistering && role === "STUDENT" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                Country of Origin
              </label>
              <select
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white focus:outline-none focus:border-[#066AC9] text-sm"
              >
                <option value="India">India</option>
                <option value="Nigeria">Nigeria</option>
                <option value="China">China</option>
                <option value="Brazil">Brazil</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="Nepal">Nepal</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#066AC9] hover:bg-[#055AAB] text-white font-semibold rounded-xl transition-all shadow-md mt-2 disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegistering ? "Create Student Account" : `Sign In as ${role === "STUDENT" ? "Student" : "Staff"}`}
          </button>
        </form>

        {/* Toggle between Login & Register (Only for Students) */}
        {role === "STUDENT" && (
          <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
            {isRegistering ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); setErrorMsg(""); }}
                  className="text-[#066AC9] font-bold hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setErrorMsg(""); }}
                  className="text-[#066AC9] font-bold hover:underline font-semibold"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
