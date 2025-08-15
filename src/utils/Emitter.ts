// src/utils/Emitter.ts
export type EventMap = Record<string, unknown>;

export class Emitter<E extends EventMap> {
  private listeners = new Map<keyof E, Set<Function>>();

  on<K extends keyof E>(type: K, handler: (payload: E[K]) => void): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set as any);
    }
    set.add(handler);
    return () => this.off(type, handler);
  }

  off<K extends keyof E>(type: K, handler: (payload: E[K]) => void) {
    this.listeners.get(type)?.delete(handler);
  }

  emit<K extends keyof E>(type: K, payload: E[K]) {
    this.listeners.get(type)?.forEach((fn) => (fn as any)(payload));
  }

  removeAll() {
    this.listeners.clear();
  }
}
