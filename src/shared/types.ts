// shared/shared.ts

// ✅ Game-agnostic full game session state (shared between table + server)
export type GameSessionState = {
  serverState: any[]; // visible to the table and all hands if needed
  handsState: {
    handId: string;
    state: any;
  }[];
};

// 💬 Chat message structure (unchanged)
export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  role: "user" | "assistant";
};

// 🔥 Game/session debug messages (non-gameplay-specific)
export type DebugMessage =
  | { type: "hand-joined"; sessionId: string; senderId: string }
  | { type: "table-confirm"; sessionId: string; senderId: string; message: string }
  | { type: "hand-disconnected"; senderId: string };

// ✅ Full message union
export type Message =
  // 🧠 Chat events
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

  // 🔁 Session hydration and state sync
  | {
      type: "hydrate";
      messages: ChatMessage[];
      gameState: GameSessionState;
    }
  | {
      type: "update-state";
      state: GameSessionState;
    }

  // 🎯 Personalized payload for individual hands
  | {
      type: "your-state";
      handId: string;
      state: any;
    }

  // 🔄 Ping used after reconnect (from table)
  | {
      type: "reconnect-ping";
    }

  // 🛠 Session lifecycle events
  | DebugMessage;
