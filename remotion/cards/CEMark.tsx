import React from "react";

export const CEMark: React.FC<{ size?: number; color?: string }> = ({ size = 48, color = "#C9A961" }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Cognitive Empire">
    <path
      d="M332 82 L184 82 L82 256 L184 430 L332 430 L294 360 L221 360 L160 256 L221 152 L294 152 Z"
      fill={color}
    />
    <path
      d="M342 194 H425 V226 H376 V242 H417 V270 H376 V286 H425 V318 H342 Z"
      fill={color}
    />
  </svg>
);
