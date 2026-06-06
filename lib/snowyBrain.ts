export type SnowyContext = {
    system_armed: boolean;
    emergency_mode_permission: boolean;
    location_permission: boolean;
    live_lat?: number;
    live_lng?: number;
    unsafe_word?: string;
  
    recentEvents?: string[];
  };
  
  export type SnowyDecision = {
    action: "ignore" | "monitor" | "escalate" | "critical";
    reason: string;
    confidence: number;
  };
  
  class SnowyBrainEngine {
    decide(context: SnowyContext): SnowyDecision {
      let riskScore = 0;
  
      // -------------------------
      // RULE: Emergency armed system
      // -------------------------
      if (context.system_armed) {
        riskScore += 2;
      }
  
      // -------------------------
      // RULE: Emergency permission
      // -------------------------
      if (context.emergency_mode_permission) {
        riskScore += 2;
      }
  
      // -------------------------
      // RULE: Location active
      // -------------------------
      if (context.location_permission && context.live_lat && context.live_lng) {
        riskScore += 1;
      }
  
      // -------------------------
      // RULE: Unsafe word detection
      // -------------------------
      if (context.unsafe_word === "TRIGGER") {
        riskScore += 5;
      }
  
      // -------------------------
      // DECISION MAP
      // -------------------------
      if (riskScore >= 7) {
        return {
          action: "critical",
          reason: "Multiple high-risk conditions detected",
          confidence: 0.95,
        };
      }
  
      if (riskScore >= 4) {
        return {
          action: "escalate",
          reason: "Moderate risk conditions active",
          confidence: 0.8,
        };
      }
  
      if (riskScore >= 2) {
        return {
          action: "monitor",
          reason: "Low-level risk detected",
          confidence: 0.6,
        };
      }
  
      return {
        action: "ignore",
        reason: "No meaningful risk detected",
        confidence: 0.9,
      };
    }
  }
  
  export const SnowyBrain = new SnowyBrainEngine();