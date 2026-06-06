export type SnowyMode = "IDLE" | "ARMED" | "EMERGENCY" | "LOCKED";

export type SnowyInput = {
  emergency_mode_permission: boolean;
  location_permission: boolean;
  notify_emergency_contact: boolean;
  call_emergency_contact: boolean;
  live_lat?: number | null;
  live_lng?: number | null;
};

export type SnowyOutput = {
  mode: SnowyMode;
  system_armed: boolean;
  actions: {
    allow_notifications: boolean;
    allow_location: boolean;
    allow_calling: boolean;
  };
  location?: {
    lat: number | null;
    lng: number | null;
  };
};

export function SnowyEngine(input: SnowyInput): SnowyOutput {
  // -------------------------
  // 1. LOCKED OVERRIDE (future safety switch)
  // -------------------------
  const locked = false;

  if (locked) {
    return {
      mode: "LOCKED",
      system_armed: false,
      actions: {
        allow_notifications: false,
        allow_location: false,
        allow_calling: false,
      },
    };
  }

  // -------------------------
  // 2. IDLE STATE
  // -------------------------
  if (!input.emergency_mode_permission && !input.location_permission) {
    return {
      mode: "IDLE",
      system_armed: false,
      actions: {
        allow_notifications: false,
        allow_location: false,
        allow_calling: false,
      },
    };
  }

  // -------------------------
  // 3. ARMED STATE
  // -------------------------
  const armed =
    input.emergency_mode_permission || input.location_permission;

  // -------------------------
  // 4. EMERGENCY STATE (future trigger logic)
  // -------------------------
  const emergencyTrigger =
    input.call_emergency_contact && input.notify_emergency_contact;

  const mode: SnowyMode =
    emergencyTrigger ? "EMERGENCY" : armed ? "ARMED" : "IDLE";

  return {
    mode,
    system_armed: mode !== "IDLE",
    actions: {
      allow_notifications: input.notify_emergency_contact && armed,
      allow_location: input.location_permission,
      allow_calling: input.call_emergency_contact && armed,
    },
    location:
      input.location_permission
        ? {
            lat: input.live_lat ?? null,
            lng: input.live_lng ?? null,
          }
        : undefined,
  };
}