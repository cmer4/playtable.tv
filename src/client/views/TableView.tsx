import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { PartySocket } from "partysocket";
import { DEBUG_MODE } from "../../shared/constants";

export function TableView() {
  const { sessionId } = useParams();
  const socketRef = useRef<PartySocket | null>(null);
  const handJoinUrl = `${window.location.origin}/hand/${sessionId}`;
  const [joinedHands, setJoinedHands] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

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

        setConnected(true);
        setJoinedHands([]);

        if (DEBUG_MODE) {
          console.log("🔄 [Table] connected — asking hands to re-announce");
        }

        socket.send(JSON.stringify({ type: "reconnect-ping" }));
      };

      socket.onmessage = (event) => {
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

        if (message.type === "hand-disconnected") {
          setJoinedHands((prev) =>
            prev.filter((id) => id !== message.senderId)
          );

          if (DEBUG_MODE) {
            console.log("👋 [Table] hand disconnected:", message.senderId);
          }
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (!active) return;
        if (DEBUG_MODE) console.log("🔌 [Table] socket closed — retrying...");
        setTimeout(connect, 1000);
      };

      socket.onerror = (err) => {
        console.warn("⚠️ [Table] WebSocket error:", err);
      };
    };

    connect();

    return () => {
      active = false;
      socketRef.current?.close();
    };
  }, [sessionId]);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Digital Poker Table</h1>
      <p>Session ID: <strong>{sessionId}</strong></p>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected (reconnecting…)"}</p>
      <p>Players joined: <strong>{joinedHands.length}</strong></p>
      <p>Players can join by scanning this QR code:</p>
      <QRCodeSVG value={handJoinUrl} size={200} />
      <p style={{ marginTop: "1rem" }}>Or visit: <code>{handJoinUrl}</code></p>

      <div className="activity-table-svg" style={{ maxWidth: "600px", margin: "2rem auto" }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
          <defs>
            <radialGradient id="feltGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#0f7c30" />
              <stop offset="80%" stopColor="#0a5d24" />
              <stop offset="100%" stopColor="#084d1e" />
            </radialGradient>
            <pattern id="feltTexture" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
              <rect width="10" height="10" fill="none"/>
              <path d="M0 0 L10 10 M10 0 L0 10" stroke="#0a5d24" strokeWidth="0.2" opacity="0.1" />
              <path d="M5 0 L5 10 M0 5 L10 5" stroke="#0f7c30" strokeWidth="0.1" opacity="0.1" />
            </pattern>
            <filter id="feltLighting" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
              <feDiffuseLighting in="blur" surfaceScale="2" diffuseConstant="1" result="diffLight">
                <feDistantLight azimuth="45" elevation="60" />
              </feDiffuseLighting>
              <feComposite in="diffLight" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lightResult" />
              <feBlend in="SourceGraphic" in2="lightResult" mode="multiply" />
            </filter>
            <filter id="feltNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="desaturatedNoise" />
              <feComposite operator="arithmetic" k1="0" k2="0.03" k3="0" k4="0" in="desaturatedNoise" in2="SourceGraphic" />
            </filter>
          </defs>
          <rect x="20" y="20" width="1560" height="860" rx="20" ry="20" fill="#8B4513" />
          <rect x="30" y="30" width="1540" height="840" rx="15" ry="15" fill="url(#feltGradient)" />
          <rect x="30" y="30" width="1540" height="840" rx="15" ry="15" fill="url(#feltTexture)" />
          <rect x="30" y="30" width="1540" height="840" rx="15" ry="15" filter="url(#feltLighting)" fill="none" opacity="0.7" />
          <rect x="30" y="30" width="1540" height="840" rx="15" ry="15" filter="url(#feltNoise)" fill="none" />
          <rect x="30" y="30" width="1540" height="840" rx="15" ry="15" fill="none" stroke="#084d1e" strokeWidth="3" opacity="0.3" />
          <rect x="30" y="30" width="1540" height="840" rx="15" ry="15" fill="none" stroke="#5D4037" strokeWidth="2" />
          </svg>
      </div>
    </div>
  );
}

