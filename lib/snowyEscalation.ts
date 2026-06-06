export type EscalationLevel =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SnowyEscalationEvent = {
  type: string;
  level: EscalationLevel;
  payload?: any;
  timestamp: number;
};

class SnowyEscalationPipeline {
  handle(event: SnowyEscalationEvent) {
    switch (event.level) {
      case "info":
        console.log("ℹ️ INFO:", event.type);
        break;

      case "low":
        console.log("🟡 LOW:", event.type);
        break;

      case "medium":
        console.log("🟠 MEDIUM ALERT:", event.type);
        break;

      case "high":
        console.log("🔴 HIGH ALERT:", event.type);
        this.triggerHighResponse(event);
        break;

      case "critical":
        console.log("🚨 CRITICAL ALERT:", event.type);
        this.triggerCriticalResponse(event);
        break;
    }
  }

  private triggerHighResponse(event: SnowyEscalationEvent) {
    // placeholder for:
    // - notify emergency contact
    // - activate UI alert
    console.log("⚠️ High-level response executed");
  }

  private triggerCriticalResponse(event: SnowyEscalationEvent) {
    // placeholder for:
    // - emergency mode activation
    // - live location sharing
    // - system lockdown (future)
    console.log("🔥 Critical response executed");
  }
}

export const SnowyEscalation = new SnowyEscalationPipeline();