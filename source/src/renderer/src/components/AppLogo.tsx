import React from 'react'

interface AppLogoProps {
  size?: number
  className?: string
  showBadge?: boolean
  isVip?: boolean
}

/**
 * TINDA POS "Mathematical Mass" Mark (The Quantum Summation T)
 * 
 * Geometry & Concept:
 * - Geometric Isometric Hexagon Block (Mass / Physical Store Density)
 * - Interlocking Golden Ratio (Φ = 1.618) Vector Beams
 * - Stylized Mathematical Summation (Σ) evolving into the Store Apex and Letter "T"
 * - High-precision Emerald + Teal + Cyan laser spectrum gradients
 */
export function AppLogo({
  size = 40,
  className = '',
  showBadge = true,
  isVip = false
}: AppLogoProps): React.JSX.Element {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
      >
        <defs>
          {/* Mathematical Mass Gradients */}
          <linearGradient id="tindaMassPrimary" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="45%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="tindaMassHighlight" x1="20" y1="15" x2="80" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="tindaQuantumBeam" x1="50" y1="30" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="tindaVipGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Isometric Hexagonal Mass (Bounding Volume) */}
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          fill="#06120e"
          stroke={isVip ? 'url(#tindaVipGlow)' : 'url(#tindaMassPrimary)'}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Internal Sacred Geometry Grid Lines */}
        <path
          d="M50,6 L50,94 M12,28 L88,72 M12,72 L88,28"
          stroke="#10b981"
          strokeWidth="1"
          strokeOpacity="0.18"
          strokeDasharray="2 3"
        />

        {/* The Mathematical Summation Apex (Σ Top Shelf / Store Apex) */}
        <path
          d="M24,24 L76,24 L58,42 L76,42"
          stroke="url(#tindaMassHighlight)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* The Central Quantum Column (Letter 'T' Stem & Energy Pillar) */}
        <path
          d="M50,24 L50,82"
          stroke="url(#tindaQuantumBeam)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Isometric Mass Base Pedestal (Balanced Checkout Equilibrium) */}
        <polygon
          points="32,82 68,82 62,88 38,88"
          fill="url(#tindaMassHighlight)"
          opacity="0.9"
        />

        {/* Quantum Vector Spark / Genius Intersection Node */}
        <circle cx="50" cy="42" r="3.5" fill="#ffffff" className="drop-shadow-[0_0_6px_#34d399]" />
      </svg>

      {/* Real-time Hardware Pulse Badge */}
      {showBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-ink-900" />
        </span>
      )}
    </div>
  )
}
