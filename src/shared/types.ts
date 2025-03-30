export type DebugMessage =
  | { type: "hand-joined"; sessionId: string; senderId: string }
  | { type: "table-confirm"; sessionId: string; senderId: string; message: string };