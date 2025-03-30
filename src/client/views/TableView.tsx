import React, { useState } from "react";
import { useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { usePartySocket } from "partysocket/react";
import { DEBUG_MODE } from "../../shared/constants";

export function TableView() {

  // grabs sessionId from URL params:
  const { sessionId } = useParams();
  const handJoinUrl = `${window.location.origin}/hand/${sessionId}`;
  const [joinedHands, setJoinedHands] = useState<string[]>([]);

  const socket = usePartySocket({
    party: "chat",
    room: sessionId!,
    onMessage: (event) => {
      const message = JSON.parse(event.data);

      if (DEBUG_MODE) {
        console.log("📥 [Table] received:", message);
      }

      if (message.type === "hand-joined") {

        const sender = message.senderId;

        setJoinedHands((prev) =>
          prev.includes(sender) ? prev : [...prev, sender]
        );

        const confirm = {
          type: "table-confirm",
          sessionId,
          senderId: "table",
          message: `Confirmed ${sender} joined.`,
        };

        socket.send(JSON.stringify(confirm));

        if (DEBUG_MODE) {
          console.log("📤 [Table] sent:", confirm);
        }
      }
    },
  });

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Digital Poker Table</h1>
      <p>Session ID: <strong>{sessionId}</strong></p>
      <p>Players joined: <strong>{joinedHands.length}</strong></p>
      <p>Players can join by scanning this QR code:</p>
      <QRCodeSVG value={handJoinUrl} size={200} />
      <p style={{ marginTop: "1rem" }}>Or visit: <code>{handJoinUrl}</code></p>

      <div style={{ marginTop: "3rem" }}>
        <p>[SVG game table will be rendered here]</p>
      </div>
    </div>
  );
}

