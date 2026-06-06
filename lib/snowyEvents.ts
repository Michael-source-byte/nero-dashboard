type SnowyEvent =
  | "safe_word_triggered"
  | "location_triggered"
  | "emergency_mode_triggered"
  | "manual_override";

type Listener = (data?: any) => void;

class SnowyEventBus {
  private listeners: Record<string, Listener[]> = {};

  emit(event: SnowyEvent, data?: any) {
    const list = this.listeners[event] || [];
    list.forEach((fn) => fn(data));
  }

  on(event: SnowyEvent, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  off(event: SnowyEvent, callback: Listener) {
    this.listeners[event] =
      this.listeners[event]?.filter((fn) => fn !== callback) || [];
  }
}

export const SnowyEvents = new SnowyEventBus();