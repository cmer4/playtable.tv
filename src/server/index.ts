import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared/types";

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  messages: ChatMessage[] = [];

  // 🔥 Track senderId per connection (connection.id → senderId)
  connectedPlayers = new Map<string, string>();

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  onStart() {
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user TEXT, role TEXT, content TEXT)`
    );
    this.messages = this.ctx.storage.sql
      .exec(`SELECT * FROM messages`)
      .toArray() as ChatMessage[];
  }

  onConnect(connection: Connection) {
    const fullHistoryMessage: Message = {
      type: "all",
      messages: this.messages,
    };
    connection.send(JSON.stringify(fullHistoryMessage));
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

  onMessage(connection: Connection, message: WSMessage) {
    const parsed = JSON.parse(message as string) as Message;

    if (parsed.type === "hand-joined" && parsed.senderId) {
      this.connectedPlayers.set(connection.id, parsed.senderId);
    }

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
