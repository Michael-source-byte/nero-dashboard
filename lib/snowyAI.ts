import { SnowyBrain } from "./snowyBrain";

export type SnowyAIInput = {
  settings: any;
  brainDecision: any;
};

export type SnowyAIOutput = {
  refinedAction: "ignore" | "monitor" | "escalate" | "critical";
  reasoning: string;
  confidence: number;
};

class SnowyAIEngine {
  async analyze(input: SnowyAIInput): Promise<SnowyAIOutput> {
    const { settings, brainDecision } = input;

    // -----------------------------
    // SIMULATED AI LAYER (for now)
    // -----------------------------
    // Later this becomes API call (OpenAI / custom model)

    const riskBoost =
      settings.unsafe_word === "TRIGGER" ? 0.4 : 0;

    const baseConfidence =
      brainDecision.action === "critical"
        ? 0.9
        : brainDecision.action === "escalate"
        ? 0.7
        : 0.4;

    const finalConfidence = Math.min(baseConfidence + riskBoost, 1);

    let refinedAction = brainDecision.action;

    // AI adjustment logic
    if (finalConfidence < 0.5) {
      refinedAction = "monitor";
    }

    if (finalConfidence > 0.85) {
      refinedAction = "critical";
    }

    return {
      refinedAction,
      reasoning: "AI adjusted risk based on context + pattern evaluation",
      confidence: finalConfidence,
    };
  }
}

export const SnowyAI = new SnowyAIEngine();