import React from 'react'
import { useSettings } from '../stores/settings'

interface AppLogoProps {
  size?: number
  className?: string
  showBadge?: boolean
  isVip?: boolean
  customLogo?: string | null
}

/**
 * TINDA POS "Ultra-Modern Quantum T" Mark (Mathematical Edition)
 * With VIP Custom Store Logo Rendering Support
 */
export function AppLogo({
  size = 40,
  className = '',
  showBadge = true,
  isVip = false,
  customLogo
}: AppLogoProps): React.JSX.Element {
  const { settings } = useSettings()
  const effectiveCustomLogo = customLogo !== undefined ? customLogo : (settings?.logo_path ?? null)

  if (effectiveCustomLogo) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="w-full h-full rounded-xl overflow-hidden border border-amber-400/30 bg-ink-950 flex items-center justify-center shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
          style={{ width: size, height: size }}
        >
          <img
            src={effectiveCustomLogo}
            alt="Store Logo"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        {showBadge && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-ink-900" />
          </span>
        )}
      </div>
    )
  }

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
        className="overflow-visible drop-shadow-[0_2px_10px_rgba(16,185,129,0.28)]"
      >
        <defs>
          {/* Base Background Gradient */}
          <linearGradient id="tindaModernBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0a231c" />
            <stop offset="50%" stopColor="#061612" />
            <stop offset="100%" stopColor="#020b08" />
          </linearGradient>

          {/* Core Emerald Mark Gradient */}
          <linearGradient id="tindaModernMark" x1="18" y1="18" x2="82" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="45%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Crossbar Apex Gradient */}
          <linearGradient id="tindaApexGlow" x1="20" y1="20" x2="80" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Stem Depth Gradient */}
          <linearGradient id="tindaStemDepth" x1="50" y1="25" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="40%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* VIP Pro Gold Radiance */}
          <linearGradient id="tindaVipModern" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Glass Bevel Highlight */}
          <linearGradient id="tindaGlassBevel" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 1. Cupertino Squircle Chassis */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          fill="url(#tindaModernBg)"
          stroke={isVip ? 'url(#tindaVipModern)' : 'url(#tindaGlassBevel)'}
          strokeWidth={isVip ? '2.5' : '1.5'}
        />

        {/* 2. Inner Radial Soft Glow */}
        <circle
          cx="50"
          cy="46"
          r="32"
          fill={isVip ? '#f59e0b' : '#10b981'}
          opacity="0.14"
          filter="blur(10px)"
        />

        {/* 3. The Modern Iconic T Mark (Mathematical Precision) */}
        {/* Top Horizontal Wing / Bar with precision rounded caps */}
        <path
          d="M20 28 C20 24.686 22.686 22 26 22 H74 C77.314 22 80 24.686 80 28 C80 31.314 77.314 34 74 34 H61 V74 C61 77.314 58.314 80 55 80 H45 C41.686 80 39 77.314 39 74 V34 H26 C22.686 34 20 31.314 20 28 Z"
          fill={isVip ? 'url(#tindaVipModern)' : 'url(#tindaModernMark)'}
        />

        {/* 4. Left Summation Winglet (Mathematical Σ Accent Angle) */}
        <path
          d="M20 40 L33 40 L26 49 L20 49 Z"
          fill={isVip ? '#fde047' : '#34d399'}
          opacity="0.85"
        />

        {/* 5. Right Summation Winglet (Symmetric Equilibrium Apex) */}
        <path
          d="M80 40 L67 40 L74 49 L80 49 Z"
          fill={isVip ? '#d97706' : '#059669'}
          opacity="0.85"
        />

        {/* 6. Vertical Light Spine Ray (Precision Optical Center) */}
        <line
          x1="50"
          y1="23"
          x2="50"
          y2="78"
          stroke={isVip ? '#fffbeb' : '#ecfdf5'}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* 7. Quantum Center Core Jewel */}
        <circle
          cx="50"
          cy="28"
          r="3"
          fill="#ffffff"
          className="drop-shadow-[0_0_5px_#34d399]"
        />
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

