import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared/types";

const DEBUG_MODE = true;

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  messages: ChatMessage[] = [];

  // 🔥 Track senderId per connection (connection.id → senderId)
  connectedPlayers = new Map<string, string>();

  // 🆕 Track game state in memory (also stored persistently via ctx.storage)
  gameState: any = null;

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
      this.gameState = storedState;
    }
  }

  async onConnect(connection: Connection) {
    // 🧠 Send stored messages and game state to reconnecting clients
    const fullHydration: Message = {
      type: "hydrate",
      messages: this.messages,
      gameState: this.gameState, // 🆕 Send game state if any
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

    if (parsed.type === "hand-joined" && parsed.senderId) {
      this.connectedPlayers.set(connection.id, parsed.senderId);
    }

    // 🆕 Handle incoming game state update from table or host
    if (parsed.type === "update-state" && parsed.state) {
      this.gameState = parsed.state;
      await this.ctx.storage.put("gameState", this.gameState);

      if (DEBUG_MODE) {
        console.log("💾 [Server] saved new game state");
      }
    }

    // 🔁 Broadcast to all other clients
    this.broadcast(message, [connection.id]);

    if (parsed.type === "add" || parsed.type === "update") {
      this.saveMessage({
        id: parsed.id,
        content: parsed.content,
        user: parsed.user,
        role: parsed.role,
      });
    }
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

// ✅ Required to hook up HTTP requests (keep this!)
export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
