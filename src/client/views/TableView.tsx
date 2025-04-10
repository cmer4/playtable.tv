import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { PartySocket } from "partysocket";
import { DEBUG_MODE } from "../../shared/constants";
import type { GameSessionState, Message } from "../../shared/types"; // ✅ import GameSessionState

export function TableView() {
  const { sessionId } = useParams();
  const socketRef = useRef<PartySocket | null>(null);
  const handJoinUrl = `${window.location.origin}/hand/${sessionId}`;
  const [joinedHands, setJoinedHands] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  // ✅ NEW: Track current serverState for UI
  const [tableState, setTableState] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(true);

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
        const message: Message = JSON.parse(event.data);
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

        // ✅ NEW: Handle full game state updates from server
        if (message.type === "update-state") {
          const newState = message.state as GameSessionState;
          setTableState(newState.serverState ?? []);
        }

        // ✅ Also hydrate from reconnect
        if (message.type === "hydrate") {
          setTableState(message.gameState.serverState ?? []);
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 🔁 If hidden, show only a small button */}
      {!showDebug && (
        <button
          onClick={() => setShowDebug(true)}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 10,
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Show Debug
        </button>
      )}

      {/* 🧠 Full overlay debug panel */}
      {showDebug && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "rgba(255, 255, 255, 0.85)",
            padding: "1rem",
            borderRadius: "10px",
            maxWidth: "400px",
            fontSize: "0.9rem",
            zIndex: 10,
          }}
        >
          {/* ✂️ Hide button inside panel */}
          <div style={{ textAlign: "right", marginBottom: "0.5rem" }}>
            <button
              onClick={() => setShowDebug(false)}
              style={{
                padding: "0.25rem 0.75rem",
                fontSize: "0.75rem",
                background: "#eee",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Hide
            </button>
          </div>

          <p>Session ID: <strong>{sessionId}</strong></p>
          <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected (reconnecting…)"}</p>
          <p>Players joined: <strong>{joinedHands.length}</strong></p>
          <p>Players can join by scanning this QR code:</p>
          <QRCodeSVG value={handJoinUrl} size={150} />
          <p style={{ marginTop: "1rem" }}>Or visit: <code>{handJoinUrl}</code></p>
          <hr />
          <h4>Server State</h4>
          <pre style={{ textAlign: "left", fontSize: "0.75rem", overflowX: "auto" }}>
            {JSON.stringify(tableState, null, 2)}
          </pre>
        </div>
      )}
      <svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid" style={{ position: 'absolute', top: 0, left: 0 }}>
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
        <rect width="1920" height="1080" fill="#f5f5f5"/>
        <g transform="translate(960, 540)">

        <ellipse
          cx="0"
          cy="0"
          rx="720"
          ry="480"
          fill="url(#feltGradient)"
          filter="url(#feltLighting)"
          stroke="#2c3e50"
          strokeWidth="5"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="720"
          ry="480"
          fill="url(#feltTexture)"
          opacity="0.6"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="720"
          ry="480"
          filter="url(#feltNoise)"
          fill="none"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="720"
          ry="480"
          fill="none"
          stroke="#084d1e"
          strokeWidth="3"
          opacity="0.3"
        />

          <circle cx="0" cy="-480" r="60" fill="#8e44ad" stroke="#333" strokeWidth="2"/>
          <text x="0" y="-470" fontSize="32" textAnchor="middle" fill="white">D</text>

          <circle cx="623.5" cy="240" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="623.5" y="250" fontSize="32" textAnchor="middle" fill="white">1</text>

          <circle cx="360" cy="415.7" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="360" y="425" fontSize="32" textAnchor="middle" fill="white">2</text>

          <circle cx="-360" cy="415.7" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="-360" y="425" fontSize="32" textAnchor="middle" fill="white">3</text>

          <circle cx="-623.5" cy="240" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="-623.5" y="250" fontSize="32" textAnchor="middle" fill="white">4</text>

          <circle cx="-720" cy="0" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="-720" y="10" fontSize="32" textAnchor="middle" fill="white">5</text>

          <circle cx="-623.5" cy="-240" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="-623.5" y="-230" fontSize="32" textAnchor="middle" fill="white">6</text>

          <circle cx="-360" cy="-415.7" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="-360" y="-405" fontSize="32" textAnchor="middle" fill="white">7</text>

          <circle cx="360" cy="-415.7" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="360" y="-405" fontSize="32" textAnchor="middle" fill="white">8</text>

          <circle cx="623.5" cy="-240" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="623.5" y="-230" fontSize="32" textAnchor="middle" fill="white">9</text>

          <circle cx="720" cy="0" r="60" fill="#3498db" stroke="#333" strokeWidth="2"/>
          <text x="720" y="10" fontSize="32" textAnchor="middle" fill="white">10</text>
        </g>
      </svg>
    </div>
  );
}
