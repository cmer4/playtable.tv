import React, { useEffect, useMemo } from "react"; // 🔥 NEW
import { useParams } from "react-router";
import { usePartySocket } from "partysocket/react";
import { DEBUG_MODE } from "../../shared/constants";

export function HandView() {

  const { sessionId } = useParams();
  const senderId = useMemo(() => `hand-${Math.floor(Math.random() * 10000)}`, []);

  const socket = usePartySocket({
    party: "chat",
    room: sessionId!,
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      if (DEBUG_MODE) {
        console.log("📥 [Hand] received:", message);
      }
      // Optional: you can add logic here to react to "table-confirm" messages if needed
    },
  });

  useEffect(() => {
    const joinMsg = {
      type: "hand-joined",
      sessionId,
      senderId,
    };
    socket.send(JSON.stringify(joinMsg));
    if (DEBUG_MODE) {
      console.log("📤 [Hand] sent:", joinMsg);
    }
  }, [sessionId, senderId, socket]);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Your Hand</h1>
      <p>Connected to session: <strong>{sessionId}</strong></p>
      <p>Your ID: <code>{senderId}</code></p>

      <div style={{ marginTop: "2rem" }}>
        <p>[Player controls will go here]</p>
      </div>
    </div>
  );
}