"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [unsafeWord, setUnsafeWord] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created successfully!");
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Logged in successfully!");
      loadSettings();
    }
  }

  async function loadSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setUnsafeWord(data.unsafe_word || "");
      setEmergencyContact(data.emergency_contact || "");
    }

    if (error) {
      console.log(error);
    }
  }

  async function saveSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first");
      return;
    }

    const { error } = await supabase
      .from("settings")
      .upsert([
        {
          user_id: user.id,
          unsafe_word: unsafeWord,
          emergency_contact: emergencyContact,
        },
      ]);

    if (error) {
      alert("Error saving settings");
      console.log(error);
    } else {
      alert("Settings saved successfully!");
    }
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
        NERO Dashboard
      </h1>

      <p style={{ marginTop: "10px", color: "gray" }}>
        AI Safety Agent Control Panel
      </p>

      <hr style={{ margin: "20px 0" }} />

      <section style={{ marginBottom: "20px" }}>
        <h2>Authentication</h2>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{
            padding: "10px",
            width: "300px",
            display: "block",
            marginBottom: "10px",
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            padding: "10px",
            width: "300px",
            display: "block",
            marginBottom: "10px",
          }}
        />

        <button
          onClick={signUp}
          style={{
            padding: "10px 16px",
            marginRight: "10px",
          }}
        >
          Sign Up
        </button>

        <button
          onClick={signIn}
          style={{
            padding: "10px 16px",
          }}
        >
          Login
        </button>
      </section>

      <hr style={{ margin: "20px 0" }} />

      <section style={{ marginBottom: "20px" }}>
        <h2>Unsafe Word</h2>

        <input
          value={unsafeWord}
          onChange={(e) => setUnsafeWord(e.target.value)}
          placeholder="Set unsafe word"
          style={{
            padding: "10px",
            width: "300px",
          }}
        />
      </section>

      <section style={{ marginBottom: "20px" }}>
        <h2>Emergency Contact</h2>

        <input
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="Add emergency contact"
          style={{
            padding: "10px",
            width: "300px",
          }}
        />
      </section>

      <button
        onClick={saveSettings}
        style={{
          padding: "12px 20px",
          backgroundColor: "red",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Save Settings
      </button>
    </main>
  );
}