import React from "react";

export function TableDefs() {
  return (
    <defs>
      <radialGradient id="feltGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#0f7c30" />
        <stop offset="80%" stopColor="#0a5d24" />
        <stop offset="100%" stopColor="#084d1e" />
      </radialGradient>

      <pattern id="feltTexture" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
        <rect width="10" height="10" fill="none" />
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
  );
}