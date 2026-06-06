"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // SECTION 1
  const [unsafeWord, setUnsafeWord] = useState("");
  const [safeWord, setSafeWord] = useState("");
  const [safePartner, setSafePartner] = useState("");
  const [safeLocation, setSafeLocation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyMessage, setEmergencyMessage] = useState("");

  // LIVE LOCATION DATA
  const [liveCoords, setLiveCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });

  // PERMISSIONS
  const [emergencyModePermission, setEmergencyModePermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // RULES
  const [notifyContact, setNotifyContact] = useState(false);
  const [callContact, setCallContact] = useState(false);

  const [deactivateSafeWord, setDeactivateSafeWord] = useState(true);
  const [deactivateSafePartner, setDeactivateSafePartner] = useState(true);
  const [deactivateSafeLocation, setDeactivateSafeLocation] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setUnsafeWord(data.unsafe_word || "");
        setSafeWord(data.safe_word || "");
        setSafePartner(data.safe_partner || "");
        setSafeLocation(data.safe_location || "");
        setEmergencyContact(data.emergency_contact || "");
        setEmergencyMessage(data.emergency_message || "");

        setEmergencyModePermission(data.emergency_mode_permission || false);
        setLocationPermission(data.location_permission || false);

        setNotifyContact(data.notify_emergency_contact || false);
        setCallContact(data.call_emergency_contact || false);

        setDeactivateSafeWord(data.deactivate_safe_word ?? true);
        setDeactivateSafePartner(data.deactivate_safe_partner ?? true);
        setDeactivateSafeLocation(data.deactivate_safe_location ?? true);
      }

      setLoading(false);
    };

    load();
  }, []);

  // -------------------------
  // EMERGENCY MODE
  // -------------------------
  async function handleEmergencyModePermission() {
    const permission = await Notification.requestPermission();

    setEmergencyModePermission(permission === "granted");
  }

  // -------------------------
  // LIVE LOCATION
  // -------------------------
  async function handleLocationPermission() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setLiveCoords(coords);
        setLocationPermission(true);
      },
      () => setLocationPermission(false)
    );
  }

  // -------------------------
  // SAVE
  // -------------------------
  async function save() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const payload = {
      user_id: user.id,

      unsafe_word: unsafeWord,
      safe_word: safeWord,
      safe_partner: safePartner,
      safe_location: safeLocation,
      emergency_contact: emergencyContact,
      emergency_message: emergencyMessage,

      emergency_mode_permission: emergencyModePermission,
      location_permission: locationPermission,

      // store live coords
      live_lat: liveCoords.lat,
      live_lng: liveCoords.lng,

      notify_emergency_contact: notifyContact,
      call_emergency_contact: callContact,

      deactivate_safe_word: deactivateSafeWord,
      deactivate_safe_partner: deactivateSafePartner,
      deactivate_safe_location: deactivateSafeLocation,
    };

    const { error } = await supabase
  .from("settings")
  .upsert(payload, { onConflict: "user_id" });

    if (error) alert(error.message);
    else alert("Settings saved successfully");
  }

  if (loading) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-[#32297A] flex items-center justify-center">
      <div className="w-[460px] bg-white rounded-[30px] p-6 shadow-2xl">

        {/* HEADER */}
        <h1 className="text-2xl font-bold text-black">SETTINGS</h1>

        <p className="text-sm text-red-600 mt-1 mb-6">
          Emergency Data [section 1]
        </p>

        <div className="space-y-3 mb-6">

          <Input label="Unsafe Word (voice recognition coming soon)" 
          value={unsafeWord} 
          setValue={setUnsafeWord} 
          />

          <Input
            label="Safe Word (voice recognition coming soon)"
            value={safeWord}
            setValue={setSafeWord}
          />

          <Input
            label="Safe Partner (fingerprint/face recognition coming soon)"
            value={safePartner}
            setValue={setSafePartner}
          />

          <Input
            label={`Safe Location ${locationPermission ? "(Live Active)" : ""}`}
            value={
              locationPermission && liveCoords.lat
                ? `${liveCoords.lat}, ${liveCoords.lng}`
                : safeLocation
            }
            setValue={setSafeLocation}
          />

          <Input
            label="Emergency Contact (call coming soon)"
            value={emergencyContact}
            setValue={setEmergencyContact}
          />

          <Input
            label="Emergency Message (message coming soon)"
            value={emergencyMessage}
            setValue={setEmergencyMessage}
          />
        </div>

        {/* RULES */}
        <p className="text-sm text-red-600 mt-4 mb-3">
          Emergency Rules [section 2]
        </p>

        <h2 className="font-semibold text-black mb-2">ACTIVATION</h2>

        <label className="flex justify-between border p-2 rounded mb-2">
          <span className="text-yellow-400">Turn on emergency mode
          <span className="text-red-600 text-xs ml-2">
          (coming soon)
          </span>
          </span>
          <input
            type="checkbox"
            checked={emergencyModePermission}
            onClick={handleEmergencyModePermission}
            readOnly
          />
        </label>


  <div className="flex justify-between border p-2 rounded mb-2">
  <span className="text-yellow-400">Call Emergency Contact
  <span className="text-red-600 text-xs ml-2">
      (coming soon)
    </span>
  </span>
  <input type="checkbox" disabled />
  </div>

  <div className="flex justify-between border p-2 rounded mb-2">
  <span className="text-yellow-400">Message Emergency Contact
  <span className="text-red-600 text-xs ml-2">
      (coming soon)
  </span>
  </span>
  <input type="checkbox" disabled />
  </div>
        <h2 className="font-semibold text-black mt-4 mb-2">DEACTIVATION</h2>

        <Check 
        label={<span className="text-yellow-400">Safe Word</span>} 
        value={deactivateSafeWord} 
        setValue={setDeactivateSafeWord} 
        />
        
        <Check 
        label={<span className="text-yellow-400">Safe Partner</span>} 
        value={deactivateSafePartner} 
        setValue={setDeactivateSafePartner} 
        />
        
        <label className="flex justify-between border p-2 rounded mb-2">
        <span className="text-yellow-400">Safe Location</span>
        <input
         type="checkbox"
         checked={locationPermission}
         onClick={handleLocationPermission}
         readOnly
         />
        </label>

        <button
          onClick={save}
          className="w-full mt-6 bg-black text-white py-2 rounded"
        >
          Save Settings
        </button>
        <button
         onClick={() => router.push("/dashboard")}
         className="w-full mt-2 text-sm text-gray-500"
        >
        Back to Dashboard
        </button>
      </div>
    </main>
  );
}

// COMPONENTS
function Input({ label, value, setValue }: any) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border p-2 rounded mt-1 text-black"
      />
    </div>
  );
}

function Check({ label, value, setValue }: any) {
  return (
    <label className="flex justify-between border p-2 rounded mb-2">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => setValue(e.target.checked)}
      />
    </label>
  );
}