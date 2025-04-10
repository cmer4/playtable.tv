import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { PartySocket } from "partysocket";
import { DEBUG_MODE } from "../../shared/constants";
import type { Message } from "../../shared/types"; // ✅ Type import

export function HandView() {
  const { sessionId } = useParams();
  const socketRef = useRef<PartySocket | null>(null);

  // 🔐 Unique per-tab hand ID
  const senderId = useMemo(() => {
    const stored = sessionStorage.getItem("senderId");
    if (stored) return stored;

    const newId = `hand-${Math.floor(Math.random() * 10000)}`;
    sessionStorage.setItem("senderId", newId);
    return newId;
  }, []);

  const [connected, setConnected] = useState(false);

  // ✅ Track the personalized state for this hand
  const [handState, setHandState] = useState<any>({});

  useEffect(() => {
    let active = true;

    const connect = () => {
      if (!sessionId) return;

      const socket = new PartySocket({
        host: window.location.host,
        room: sessionId,
        party: "chat",
      });

      socketRef.current = socket;

      socket.onopen = () => {
        const joinMsg = {
          type: "hand-joined",
          sessionId,
          senderId,
        };
        socket.send(JSON.stringify(joinMsg));
        setConnected(true);
        if (DEBUG_MODE) {
          console.log("🔄 [Hand] connected and sent:", joinMsg);
        }
      };

      socket.onmessage = (event) => {
        const message: Message = JSON.parse(event.data);
        if (DEBUG_MODE) {
          console.log("📥 [Hand] received:", message);
        }

        // 🔁 Respond to reconnect ping from table
        if (message.type === "reconnect-ping") {
          const rejoinMsg = {
            type: "hand-joined",
            sessionId,
            senderId,
          };
          socket.send(JSON.stringify(rejoinMsg));
          if (DEBUG_MODE) {
            console.log("🔁 [Hand] responded to reconnect-ping");
          }
        }

        // ✅ NEW: personalized state received
        if (message.type === "your-state" && message.handId === senderId) {
          setHandState(message.state ?? {});
          if (DEBUG_MODE) {
            console.log("🎯 [Hand] received personalized state:", message.state);
          }
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (!active) return;
        if (DEBUG_MODE) console.log("🔌 [Hand] socket closed — retrying in 1s");
        setTimeout(connect, 1000);
      };

      socket.onerror = (err) => {
        console.warn("⚠️ [Hand] WebSocket error:", err);
      };
    };

    connect();

    return () => {
      active = false;
      socketRef.current?.close();
    };
  }, [sessionId, senderId]);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Your Hand</h1>
      <p>Connected to session: <strong>{sessionId}</strong></p>
      <p>Your ID: <code>{senderId}</code></p>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected (reconnecting…)"}</p>

      <div style={{ marginTop: "2rem" }}>
        <h3>Your Hand State:</h3>
        <pre style={{ background: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
          {JSON.stringify(handState, null, 2)}
        </pre>
      </div>
    </div>
  );
}
