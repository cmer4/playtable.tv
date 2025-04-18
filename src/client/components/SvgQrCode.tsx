import React from "react";
import QRCode from "qrcode";

type SvgQrCodeProps = {
  value: string;
  size?: number;        // total size in SVG units (e.g., 100 = 100x100)
  cellSize?: number;    // size of each QR square block (default 1)
  fg?: string;
  bg?: string;
  margin?: number;      // number of empty cells around QR
};

export function SvgQrCode({
  value,
  size = 100,
  cellSize = 1,
  fg = "black",
  bg,
  margin = 0,
}: SvgQrCodeProps) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const matrixSize = qr.modules.size;
  const totalSize = (matrixSize + margin * 2) * cellSize;

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={totalSize}
      height={totalSize}
      shapeRendering="crispEdges"
    >
      {bg && (
        <rect width={totalSize} height={totalSize} fill={bg} />
      )}

      {Array.from({ length: matrixSize }, (_, y) =>
        Array.from({ length: matrixSize }, (_, x) =>
          qr.modules.get(x, y) ? (
            <rect
              key={`${x}-${y}`}
              x={(x + margin) * cellSize}
              y={(y + margin) * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fg}
            />
          ) : null
        )
      )}
    </svg>
  );
}
