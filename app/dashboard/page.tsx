"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { User, Settings } from "lucide-react";
import Image from "next/image";
import { SnowyEngine } from "../../lib/snowy";
import { SnowyRuntime } from "../../lib/snowyRuntime";
import { SnowyEvents } from "../../lib/snowyEvents";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const [systemArmed, setSystemArmed] = useState(false);

  console.log("DASHBOARD MOUNTED");

  useEffect(() => {
    let channel: any;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsActive(data.snowy_active || false);

        const result = SnowyEngine({
          emergency_mode_permission: data.emergency_mode_permission,
          location_permission: data.location_permission,
          notify_emergency_contact: data.notify_emergency_contact,
          call_emergency_contact: data.call_emergency_contact,
          live_lat: data.live_lat,
          live_lng: data.live_lng,
        });

        setSystemArmed(result.system_armed);

        // =========================
        // EVENT LISTENERS (ADDED)
        // =========================
        SnowyEvents.on("emergency_mode_triggered", () => {
          console.log("🚨 EMERGENCY MODE ACTIVATED");
        });

        SnowyEvents.on("location_triggered", (data) => {
          console.log("📍 Location event:", data);
        });

        SnowyEvents.on("safe_word_triggered", () => {
          console.log("🧠 Safe word detected");
        });
      }

      channel = supabase
        .channel("settings-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "settings",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const data = payload.new as any;

            setIsActive(data?.snowy_active || false);

            const result = SnowyEngine({
              emergency_mode_permission: data.emergency_mode_permission,
              location_permission: data.location_permission,
              notify_emergency_contact: data.notify_emergency_contact,
              call_emergency_contact: data.call_emergency_contact,
              live_lat: data.live_lat,
              live_lng: data.live_lng,
            });

            setSystemArmed(result.system_armed);
          }
        )
        .subscribe();

      setLoading(false);
    };

    load();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function toggleActive() {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) return;

    const newState = !isActive;
    setIsActive(newState);

    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (newState) {
      SnowyRuntime.start(user.id, settings);
    } else {
      SnowyRuntime.stop();
    }

    await supabase.from("settings").upsert(
      {
        user_id: user.id,
        snowy_active: newState,
      },
      { onConflict: "user_id" }
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#32297A] text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#32297A] flex items-center justify-center relative">

      {showProfile && (
        <div className="absolute top-20 left-10 bg-white shadow-xl rounded-xl p-4 w-56 z-50">
          <p className="text-sm text-gray-600 mb-2">{userEmail}</p>

          <button className="w-full text-left py-2 text-sm">
            Subscribe
          </button>

          <button
            onClick={logout}
            className="w-full text-left py-2 text-sm text-red-500"
          >
            Logout
          </button>
        </div>
      )}

      <div className="w-[380px] h-[760px] bg-[#F5F5F5] rounded-[40px] shadow-2xl flex flex-col">

        <div className="flex justify-between items-center px-6 pt-6">

          <button
            onClick={() => setShowProfile(!showProfile)}
            className="text-black"
          >
            <User size={22} />
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="text-black"
          >
            <Settings size={22} />
          </button>

        </div>

        <div className="flex justify-center mt-4">
          <Image
            src="/NERO.png"
            alt="logo"
            width={120}
            height={40}
            priority
          />
        </div>

        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-20 h-56 bg-black rounded-[20px]" />

          <button
            onClick={toggleActive}
            className={`
              mt-8 w-28 h-28 rounded-full text-white text-xl font-bold shadow-lg
              ${isActive ? "bg-green-500" : "bg-red-600"}
            `}
          >
            {isActive ? "OFF" : "ON"}
          </button>
        </div>

      </div>
    </main>
  );
}