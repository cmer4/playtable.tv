// shared/shared.ts

// Core chat structure (unchanged)
export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  role: "user" | "assistant";
};

// 🔥 NEW: Game/debug messages for joining/disconnecting/etc.
export type DebugMessage =
  | { type: "hand-joined"; sessionId: string; senderId: string }
  | { type: "table-confirm"; sessionId: string; senderId: string; message: string }
  | { type: "hand-disconnected"; senderId: string };

// ✅ Combined union for all message types
export type Message =
  | {
      type: "add";
      id: string;
      content: string;
      user: string;
      role: "user" | "assistant";
    }
  | {
      type: "update";
      id: string;
      content: string;
      user: string;
      role: "user" | "assistant";
    }
  | {
      type: "hydrate";
      messages: ChatMessage[];
      gameState: any;
    }
  | {
      type: "update-state";
      state: any
    }
  | {
      type: "reconnect-ping";
    }
  | DebugMessage; // 🔥 NEW: Include game/session messages
