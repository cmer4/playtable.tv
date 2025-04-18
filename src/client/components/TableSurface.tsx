import React from "react";

export function TableSurface() {
  return (
    <>
      <ellipse cx="950" cy="540" rx="950" ry="530" fill="#8B4513" />
      <ellipse cx="950" cy="540" rx="935" ry="515" fill="url(#feltGradient)" />
      <ellipse cx="950" cy="540" rx="935" ry="515" fill="url(#feltTexture)" />
      <ellipse cx="950" cy="540" rx="935" ry="515" filter="url(#feltLighting)" fill="none" opacity="0.7" />
      <ellipse cx="950" cy="540" rx="935" ry="515" filter="url(#feltNoise)" fill="none" />
      <ellipse cx="950" cy="540" rx="935" ry="515" fill="none" stroke="#084d1e" strokeWidth="3" opacity="0.3" />
      <ellipse cx="950" cy="540" rx="935" ry="515" fill="none" stroke="#5D4037" strokeWidth="2" />
    </>
  );
}