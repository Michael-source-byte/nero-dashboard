"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // SECTION 1
  const [snowyEnabled, setSnowyEnabled] = useState(false);
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
  const [safeLat, setSafeLat] = useState<number | null>(null);
  const [safeLng, setSafeLng] = useState<number | null>(null);

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
  const [safeAudioURL, setSafeAudioURL] = useState<string | null>(null);
  const [unsafeAudioURL, setUnsafeAudioURL] = useState<string | null>(null);
  const [recordingType, setRecordingType] = useState<"safe" | "unsafe" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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

        setSafeLat(data.safe_lat ?? null);
        setSafeLng(data.safe_lng ?? null);
        setSnowyEnabled(data.snowy_enabled ?? false);

        setEmergencyContact(data.emergency_contact || "");
        setEmergencyMessage(data.emergency_message || "");

        setEmergencyModePermission(data.emergency_mode_permission || false);
        setLocationPermission(data.location_permission || false);

        setNotifyContact(data.notify_emergency_contact || false);
        setCallContact(data.call_emergency_contact || false);

        setDeactivateSafeWord(data.deactivate_safe_word ?? true);
        setDeactivateSafePartner(data.deactivate_safe_partner ?? true);
        setDeactivateSafeLocation(data.deactivate_safe_location ?? true);
        setFaceImage(data.safe_partner_image_url || null);
        setSafeAudioURL(data.safe_word_audio_url || null);
        setUnsafeAudioURL(data.unsafe_word_audio_url || null);
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

  async function enrollSafeLocation() {
    if (!navigator.geolocation) {
      alert("Location services unavailable");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSafeLat(position.coords.latitude);
        setSafeLng(position.coords.longitude);
  
        alert("Safe location enrolled");
      },
      () => {
        alert("Failed to get location");
      }
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

  async function startRecording(type: "safe" | "unsafe") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    setRecordingType(type);
    setAudioChunks([]);
  
    recorder.ondataavailable = (e) => {
      setAudioChunks((prev) => [...prev, e.data]);
    };
  
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  
      const fileName = `${type}-${Date.now()}.webm`;
  
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
  
      if (!user) return;
  
      const { error } = await supabase.storage
        .from("voice-enrollments")
        .upload(`${user.id}/${fileName}`, audioBlob, {
          contentType: "audio/webm",
        });
  
      if (error) {
        alert(error.message);
        return;
      }
  
      const { data } = supabase.storage
        .from("voice-enrollments")
        .getPublicUrl(`${user.id}/${fileName}`);
  
      if (type === "safe") setSafeAudioURL(data.publicUrl);
      if (type === "unsafe") setUnsafeAudioURL(data.publicUrl);
    };
  
    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setIsRecording(false);
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
      
      snowy_enabled: snowyEnabled,
      unsafe_word: unsafeWord,
      safe_word: safeWord,
      safe_partner: safePartner,
      safe_location: safeLocation,
      emergency_contact: emergencyContact,
      emergency_message: emergencyMessage,

      emergency_mode_permission: emergencyModePermission,
      location_permission: locationPermission,
      safe_lat: safeLat,
      safe_lng: safeLng,

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
      safe_word_audio_url: safeAudioURL,
      unsafe_word_audio_url: unsafeAudioURL,
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
        <div className="mt-4">
  <label className="text-xs text-gray-500">Unsafe Word (Voice)</label>

  <div className="flex gap-2 mt-1">
    <button
      onClick={() => startRecording("unsafe")}
      className="bg-black text-white px-3 py-1 rounded"
    >
      Record
    </button>

    <button
      onClick={stopRecording}
      className="bg-gray-300 px-3 py-1 rounded"
    >
      Stop
    </button>
  </div>

  {unsafeAudioURL && (
    <audio controls className="mt-2 w-full">
      <source src={unsafeAudioURL} />
    </audio>
  )}
</div>

          <div>
  <label className="text-xs text-gray-500">Safe Word (Voice)</label>

  <div className="flex gap-2 mt-1">
    <button
      onClick={() => startRecording("safe")}
      className="bg-black text-white px-3 py-1 rounded"
    >
      Record
    </button>

    <button
      onClick={stopRecording}
      className="bg-gray-300 px-3 py-1 rounded"
    >
      Stop
    </button>
  </div>

  {safeAudioURL && (
    <audio controls className="mt-2 w-full">
      <source src={safeAudioURL} />
    </audio>
  )}
</div>

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

         <div className="border rounded p-3">
  <label className="text-xs text-gray-500">
    Safe Location
  </label>

  <button
    type="button"
    onClick={enrollSafeLocation}
    className="w-full mt-2 bg-black text-white py-2 rounded"
  >
    Set Current Location
  </button>

  {safeLat && safeLng && (
    <div className="mt-3 text-sm text-black">
      <p>✅ Safe Location Saved</p>
      <p>Latitude: {safeLat}</p>
      <p>Longitude: {safeLng}</p>
    </div>
  )}
</div>

          <Input label="Emergency Contact" value={emergencyContact} setValue={setEmergencyContact} />

          <Input label="Emergency Message" value={emergencyMessage} setValue={setEmergencyMessage} />



       {/* SNOWY STATUS ONLY */}
<div className="border rounded-xl p-4 mb-6">
  <h3 className="font-bold text-black">Snowy AI</h3>

  <p
    className={`mt-2 font-bold ${
      snowyEnabled ? "text-green-600" : "text-red-600"
    }`}
  >
    {snowyEnabled ? "READY" : "NOT READY"}
  </p>

  <p className="text-xs text-gray-500 mt-1">
    Controlled from Dashboard
  </p>
</div>

        </div>

        <button 

        onClick={save} className="w-full mt-6 bg-black text-white py-2 rounded">
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