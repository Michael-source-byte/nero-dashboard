import { SnowyEngine } from "./snowy";
import { SnowyEscalation } from "./snowyEscalation";
import { SnowyBrain } from "./snowyBrain";
import { SnowyAI } from "./snowyAI";

type SnowySession = {
  active: boolean;
  intervalId?: NodeJS.Timeout;
  userId?: string;
};

class SnowyRuntimeController {
  private session: SnowySession = {
    active: false,
  };

  private latestSettings: any = null;

  start(userId: string, settings: any) {
    if (this.session.active) return;

    this.session.active = true;
    this.session.userId = userId;
    this.latestSettings = settings;

    console.log("🧠 Snowy started");

    this.session.intervalId = setInterval(() => {
      this.tick();
    }, 2000);
  }

  stop() {
    if (!this.session.active) return;

    if (this.session.intervalId) {
      clearInterval(this.session.intervalId);
    }

    this.session = {
      active: false,
    };

    console.log("🛑 Snowy stopped");
  }

  updateSettings(settings: any) {
    this.latestSettings = settings;
  }

  // =========================
  // UPDATED TICK FUNCTION ONLY
  // =========================
  private async tick() {
    if (!this.session.active || !this.latestSettings) return;

    const result = SnowyEngine(this.latestSettings);

    console.log("⚡ Snowy Tick:", result);

    // =============================
    // AI DECISION LAYER (UPDATED)
    // =============================

    const brainDecision = SnowyBrain.decide(this.latestSettings);

    const aiDecision = await SnowyAI.analyze({
      settings: this.latestSettings,
      brainDecision,
    });

    // 1. Critical AI decision routing
    if (aiDecision.refinedAction === "critical") {
      SnowyEscalation.handle({
        type: "ai_critical",
        level: "critical",
        timestamp: Date.now(),
      });
    }

    // 2. Escalation AI decision routing
    if (aiDecision.refinedAction === "escalate") {
      SnowyEscalation.handle({
        type: "ai_escalate",
        level: "high",
        timestamp: Date.now(),
      });
    }
  }

  isActive() {
    return this.session.active;
  }
}

export const SnowyRuntime = new SnowyRuntimeController();