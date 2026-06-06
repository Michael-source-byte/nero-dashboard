"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  console.log("LOGIN PAGE RENDERED");

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return alert(error.message);

    router.push("/dashboard");
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert(error.message);

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#32297A]">
      <div className="w-[380px] bg-white rounded-[30px] shadow-2xl p-8">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image
            src="/NEROBGL.png"
            alt="NERO Logo"
            width={90}
            height={90}
            priority
          />
        </div>

        {/* HEADER */}
        <h1 className="text-2xl font-bold text-black text-center">
          NERO LOGIN
        </h1>

        <p className="text-sm text-gray-500 text-center mt-1 mb-6">
          Secure access portal
        </p>

        {/* INPUTS */}
        <div className="space-y-4">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3 text-black outline-none focus:border-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3 text-black outline-none focus:border-black"
          />
        </div>

        {/* BUTTONS */}
        <div className="mt-6 space-y-3">
          <button
            onClick={signIn}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90"
          >
            Login
          </button>

          <button
            onClick={signUp}
            className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-black hover:text-white transition"
          >
            Sign Up
          </button>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Powered by NERO Security System
        </p>
      </div>
    </main>
  );
}