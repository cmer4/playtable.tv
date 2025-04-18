import React, { useState } from "react";

type DebugPanelProps = {
  sessionId: string | undefined;
  connected: boolean;
  joinedHands: string[];
  handJoinUrl: string;
  tableState: any[];
};

export function DebugPanel({
  sessionId,
  connected,
  joinedHands,
  handJoinUrl,
  tableState,
}: DebugPanelProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
          padding: "0.5rem 1rem",
          fontSize: "0.9rem",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Show Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        left: "auto",
        background: "rgba(255, 255, 255, 0.85)",
        padding: "1rem",
        borderRadius: "10px",
        maxWidth: "400px",
        fontSize: "0.9rem",
        zIndex: 10,
      }}
    >
      <div style={{ textAlign: "right", marginBottom: "0.5rem" }}>
        <button
          onClick={() => setVisible(false)}
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
      <p>
        Table URL:&nbsp;
        <a
            href={handJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "monospace", wordBreak: "break-all" }}
        >
            {handJoinUrl}
        </a>
      </p>
      <hr />
      <h4>Server State</h4>
      <pre style={{ textAlign: "left", fontSize: "0.75rem", overflowX: "auto" }}>
        {JSON.stringify(tableState, null, 2)}
      </pre>
    </div>
  );
}
