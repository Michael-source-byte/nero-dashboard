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

  // STEP 1 — NEW STATE VARIABLES
  const [voiceRecorderPermission, setVoiceRecorderPermission] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);

  // RULES
  const [notifyContact, setNotifyContact] = useState(false);
  const [callContact, setCallContact] = useState(false);

  const [deactivateSafeWord, setDeactivateSafeWord] = useState(true);
  const [deactivateSafePartner, setDeactivateSafePartner] = useState(true);
  const [deactivateSafeLocation, setDeactivateSafeLocation] = useState(true);

  const [messageOverlayOpen, setMessageOverlayOpen] = useState(false);

  const [messageOptions, setMessageOptions] = useState({
    location: false,
    recording: false,
    both: false,
  });

  const isMessageActive =
    messageOptions.location ||
    messageOptions.recording ||
    messageOptions.both;

  // FIX 3 — proper sync
  useEffect(() => {
    setNotifyContact(isMessageActive);
  }, [isMessageActive]);

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
        setVoiceRecorderPermission(
          data.voice_recorder_permission || false
        );
        
        setCameraPermission(
          data.camera_permission || false
        );
        setFaceImage(data.safe_partner_image_url || null);
      }

      setLoading(false);
    };

    load();
  }, []);

  async function handleEmergencyModePermission() {
    // user preference mode
    if (emergencyModePermission) {
      setEmergencyModePermission(false);
      return;
    }
  
    // first-time permission request
    const permission = await Notification.requestPermission();
  
    if (permission === "granted") {
      setEmergencyModePermission(true);
    }
  }

  async function handleLocationPermission() {
    if (locationPermission) {
      setLocationPermission(false);
      return;
    }
  
    if (!navigator.geolocation) return;
  
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
  
        setLocationPermission(true);
      },
      () => setLocationPermission(false)
    );
  }

  async function handleVoiceRecorderPermission() {
    if (voiceRecorderPermission) {
      setVoiceRecorderPermission(false);
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
  
      setVoiceRecorderPermission(true);
  
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setVoiceRecorderPermission(false);
    }
  }

  async function handleCameraPermission()
  {
    if (cameraPermission) {
      setCameraPermission(false);
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
  
      setCameraPermission(true);
  
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setCameraPermission(false);
    }
  }

  async function enrollFace(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    const { data: userData } = await supabase.auth.getUser();
  
    const user = userData.user;
  
    if (!user) return;
  
    const filePath = `${user.id}/face.jpg`;
  
    const { error } = await supabase.storage
      .from("safe-partner-faces")
      .upload(filePath, file, {
        upsert: true,
      });
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const { data } = supabase.storage
      .from("safe-partner-faces")
      .getPublicUrl(filePath);
  
    setFaceImage(data.publicUrl);
  }

function toggleMessageOption(
  type: "location" | "recording" | "both"
) {
  setMessageOptions((prev) => {
    const next = {
      ...prev,
      [type]: !prev[type],
    };

    // BOTH turned on
    if (type === "both" && !prev.both) {
      next.location = true;
      next.recording = true;
    }

    // BOTH turned off
    if (type === "both" && prev.both) {
      next.location = false;
      next.recording = false;
    }

    // Auto-enable BOTH if both options selected
    if (
      type !== "both" &&
      next.location &&
      next.recording
    ) {
      next.both = true;
    }

    // Auto-disable BOTH if either unchecked
    if (
      type !== "both" &&
      (!next.location || !next.recording)
    ) {
      next.both = false;
    }

    return next;
  });
}
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

      live_lat: liveCoords.lat,
      live_lng: liveCoords.lng,

      notify_emergency_contact: notifyContact,
      call_emergency_contact: callContact,

      deactivate_safe_word: deactivateSafeWord,
      deactivate_safe_partner: deactivateSafePartner,
      deactivate_safe_location: deactivateSafeLocation,
      voice_recorder_permission: voiceRecorderPermission,
      camera_permission: cameraPermission,
      snowy_ai_enabled: true,
      safe_partner_image_url: faceImage,
    };

    const { error } = await supabase
      .from("settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) alert(error.message);
    else alert("Settings saved successfully");
  }

  if (loading) return <main className="p-6">Loading...</main>;

  return (
    <main className="min-h-screen bg-[#32297A] flex items-center justify-center">
      <div className="w-[460px] bg-white rounded-[30px] p-6 shadow-2xl">

        <h1 className="text-2xl font-bold text-black">SETTINGS</h1>

        <p className="text-sm text-red-600 mt-4 mb-3">
          Emergency Rules [section 1]
        </p>

        <h2 className="font-semibold text-black mb-2">ACTIVATION</h2>

        <label className="flex justify-between border p-2 rounded mb-2">
          <span className="text-yellow-400">Turn on emergency mode</span>
          <input
            type="checkbox"
            checked={emergencyModePermission}
            onClick={handleEmergencyModePermission}
            readOnly
          />
        </label>

        <label className="flex justify-between border p-2 rounded mb-2">
          <span className="text-yellow-400">Turn On Voice Recorder</span>
          <input
            type="checkbox"
            checked={voiceRecorderPermission}
            onClick={handleVoiceRecorderPermission}
            readOnly
          />
        </label>

        {/* MESSAGE CONTACT */}
        <label
          className="flex justify-between border p-2 rounded mb-2 cursor-pointer"
          onClick={() => setMessageOverlayOpen(true)}
        >
          <span className="text-yellow-400">Message Emergency Contact</span>
          <input type="checkbox" checked={notifyContact} readOnly />
        </label>

        <h2 className="font-semibold text-black mt-4 mb-2">DEACTIVATION</h2>

        <Check
          label={<span className="text-yellow-400">Safe Word</span>}
          value={deactivateSafeWord}
          setValue={setDeactivateSafeWord}
        />

        <label className="flex justify-between border p-2 rounded mb-2">
          <span className="text-yellow-400">Safe Partner (Face ID)</span>
          <input
            type="checkbox"
            checked={cameraPermission}
            onClick={handleCameraPermission}
            readOnly
          />
        </label>

        <label className="flex justify-between border p-2 rounded mb-2">
          <span className="text-yellow-400">Safe Location</span>
          <input
            type="checkbox"
            checked={locationPermission}
            onClick={handleLocationPermission}
            readOnly
          />
        </label>

        <p className="text-sm text-red-600 mt-1 mb-6">
          Emergency Data [section 2]
        </p>

        <div className="space-y-3 mb-6">
          <Input label="Unsafe Word" value={unsafeWord} setValue={setUnsafeWord} />

          <Input label="Safe Word" value={safeWord} setValue={setSafeWord} />

        <div>
        <label className="text-xs text-gray-500">
        Safe Partner Face ID
        </label>

         <input
        type="file"
        accept="image/*"
        capture="user"
        onChange={enrollFace}
        className="w-full border p-2 rounded mt-1"
        />

        {faceImage && (
        <img
        src={faceImage}
        alt="Face ID"
        className="mt-2 rounded w-32 h-32 object-cover"
        />
        )}
         </div>

          <Input label="Safe Location" value={safeLocation} setValue={setSafeLocation} />

          <Input label="Emergency Contact" value={emergencyContact} setValue={setEmergencyContact} />

          <Input label="Emergency Message" value={emergencyMessage} setValue={setEmergencyMessage} />

        </div>

        <button onClick={save} className="w-full mt-6 bg-black text-white py-2 rounded">
          Save Settings
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full mt-2 text-sm text-gray-500"
        >
          Back to Dashboard
        </button>

        {/* OVERLAY */}
        {messageOverlayOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white w-[320px] p-4 rounded-xl text-black">

              <h3 className="font-bold mb-3">Message Emergency Contact</h3>

              <label className="flex items-center gap-2 mb-2 text-black">
                <input
                  type="checkbox"
                  checked={messageOptions.location}
                  onChange={() => toggleMessageOption("location")}
                />
                With Live Location
              </label>

              <label className="flex items-center gap-2 mb-2 text-black">
                <input
                  type="checkbox"
                  checked={messageOptions.recording}
                  onChange={() => toggleMessageOption("recording")}
                />
                With Live Recording
              </label>

              <label className="flex items-center gap-2 mb-4 text-black">
                <input
                  type="checkbox"
                  checked={messageOptions.both}
                  onChange={() => toggleMessageOption("both")}
                />
                Both (Independent)
              </label>

              <button
                className="w-full bg-black text-white py-2 rounded"
                onClick={() => setMessageOverlayOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

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