import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, GameSessionState, Message } from "../shared/types";

const DEBUG_MODE = true;

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  messages: ChatMessage[] = [];

  // 🔥 Track senderId per connection (connection.id → senderId)
  connectedPlayers = new Map<string, string>();

  // ✅ Game state now has structure: { serverState, handsState }
  gameState: GameSessionState = {
    serverState: [],
    handsState: [],
  };

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  async onStart() {
    // 💾 Load persistent messages
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user TEXT, role TEXT, content TEXT)`
    );
    this.messages = this.ctx.storage.sql
      .exec(`SELECT * FROM messages`)
      .toArray() as ChatMessage[];

    // 💾 Load game state from PartyKit key-value storage
    const storedState = await this.ctx.storage.get("gameState");
    if (storedState) {
      this.gameState = storedState as GameSessionState;
    }
  }

  async onConnect(connection: Connection) {
    // 🧠 Send stored messages and full game state (only meaningful to table)
    const fullHydration: Message = {
      type: "hydrate",
      messages: this.messages,
      gameState: this.gameState,
    };
    connection.send(JSON.stringify(fullHydration));
  }

  saveMessage(message: ChatMessage) {
    const existing = this.messages.find((m) => m.id === message.id);
    if (existing) {
      this.messages = this.messages.map((m) =>
        m.id === message.id ? message : m
      );
    } else {
      this.messages.push(message);
    }

    this.ctx.storage.sql.exec(
      `INSERT INTO messages (id, user, role, content)
       VALUES ('${message.id}', '${message.user}', '${message.role}', ${JSON.stringify(message.content)})
       ON CONFLICT (id) DO UPDATE SET content = ${JSON.stringify(message.content)}`
    );
  }

  async onMessage(connection: Connection, message: WSMessage) {
    const parsed = JSON.parse(message as string) as Message;

    // 🔐 Track sender ID
    if (parsed.type === "hand-joined" && parsed.senderId) {
      this.connectedPlayers.set(connection.id, parsed.senderId);

      // 🧠 Ensure that hand has an entry in gameState
      const existing = this.gameState.handsState.find(
        (h) => h.handId === parsed.senderId
      );
      if (!existing) {
        this.gameState.handsState.push({
          handId: parsed.senderId,
          state: {}, // default empty state
        });
        await this.ctx.storage.put("gameState", this.gameState);
      }

      // 🎯 Send just that hand’s state back
      const handState = this.gameState.handsState.find(
        (h) => h.handId === parsed.senderId
      );
      connection.send(
        JSON.stringify({
          type: "your-state",
          handId: parsed.senderId,
          state: handState?.state ?? {},
        })
      );
    }

    // 🧠 Game state update from table or controller
    if (parsed.type === "update-state" && parsed.state) {
      this.gameState = parsed.state;
      await this.ctx.storage.put("gameState", this.gameState);

      if (DEBUG_MODE) {
        console.log("💾 [Server] saved new game state");
      }

      // 🖥 Table gets full gameState
      const tableUpdate: Message = {
        type: "update-state",
        state: this.gameState,
      };
      this.broadcastMessage(tableUpdate);

      // ✉️ Each hand gets only its slice
      this.gameState.handsState.forEach((hand) => {
        const msg: Message = {
          type: "your-state",
          handId: hand.handId,
          state: hand.state,
        };
        // Note: this sends to all hands — optionally you could track and only send to matching connection IDs
        this.broadcastMessage(msg);
      });
    }

    // 📦 Game action (add/update messages)
    if (parsed.type === "add" || parsed.type === "update") {
      this.saveMessage({
        id: parsed.id,
        content: parsed.content,
        user: parsed.user,
        role: parsed.role,
      });
    }

    // 🔁 Let other clients react to generic messages
    this.broadcast(message, [connection.id]);
  }

  onClose(connection: Connection) {
    const senderId = this.connectedPlayers.get(connection.id);
    if (senderId) {
      const disconnectMessage: Message = {
        type: "hand-disconnected",
        senderId,
      };
      this.broadcastMessage(disconnectMessage, [connection.id]);
      this.connectedPlayers.delete(connection.id);
    }
  }
}

// ✅ Required to hook up HTTP requests
export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
