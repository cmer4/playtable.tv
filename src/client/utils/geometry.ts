export function getCoordinatesForClockPosition(clockPosition: number, cx = 950, cy = 540, rx = 935, ry = 515) {
    const angleDeg = (clockPosition % 12) * 30 - 90;
    const angleRad = angleDeg * (Math.PI / 180);
    return {
      x: cx + rx * Math.cos(angleRad),
      y: cy + ry * Math.sin(angleRad),
    };
  }