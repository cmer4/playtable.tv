import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { PartySocket } from "partysocket";
import { DEBUG_MODE } from "../../shared/constants";
import type { GameSessionState, Message } from "../../shared/types"; // ✅ import GameSessionState
import { DebugPanel } from "../components/DebugPanel";
import { TableDefs } from "../components/TableDefs";
import { TableSurface } from "../components/TableSurface";
import { getCoordinatesForClockPosition } from "../utils/geometry";
import { SvgQrCode } from "../components/SvgQrCode";

export function TableView() {
  const { sessionId } = useParams();
  const socketRef = useRef<PartySocket | null>(null);
  const handJoinUrl = `${window.location.origin}/hand/${sessionId}`;
  const [joinedHands, setJoinedHands] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [tableState, setTableState] = useState<any[]>([]);
  const playerClockPositions = [4, 5, 7, 8, 9, 10, 11, 1, 2, 3]; // skip 6
  const dealerPosition = 12;

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

      <DebugPanel
        sessionId={sessionId}
        connected={connected}
        joinedHands={joinedHands}
        handJoinUrl={handJoinUrl}
        tableState={tableState}
      />

      <svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid" style={{ position: 'absolute', top: 0, left: 0, backgroundColor: "000" }}>
        
      <TableDefs />

      <SvgQrCode value={handJoinUrl} size={100} cellSize={4} fg="black" bg="white" margin={6} />

      <TableSurface />

      {/* Dealer at 12 o'clock */}
      {(() => {
        const { x, y } = getCoordinatesForClockPosition(dealerPosition);
        return (
          <>
            <circle cx={x} cy={y} r={60} fill="#8e44ad" stroke="#333" strokeWidth="2" />
            <text x={x} y={y + 10} fontSize="32" textAnchor="middle" fill="white">D</text>
          </>
        );
      })()}

      {/* Players 1-10 */}
      {playerClockPositions.map((clock, index) => {
        const { x, y } = getCoordinatesForClockPosition(clock);
        return (
          <g key={index}>
            <circle cx={x} cy={y} r={60} fill="#3498db" stroke="#333" strokeWidth="2" />
            <text x={x} y={y + 10} fontSize="32" textAnchor="middle" fill="white">{index + 1}</text>
          </g>
        );
      })}

      </svg>
    </div>
  );
}
