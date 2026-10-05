import { Palette, Check } from 'lucide-react'
import { useTheme, THEME_OPTIONS, type AppTheme } from '../../stores/theme'

export function ThemeSelector(): React.JSX.Element {
  const { theme, setTheme } = useTheme()

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Appearance &amp; Store Background</h3>
            <p className="text-xs text-slate-400">
              Select the color theme that provides optimal visibility and comfort for your store environment.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Theme Swatch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = theme === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id as AppTheme)}
              className={`group relative flex items-start gap-3.5 rounded-xl border p-3.5 text-left transition duration-200 active:scale-[0.98] ${
                isSelected
                  ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/30'
                  : 'border-ink-line bg-ink-900/60 hover:border-slate-500 hover:bg-ink-800/40'
              }`}
            >
              {/* Visual mini-swatch preview */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border shadow-inner text-lg"
                style={{
                  backgroundColor: opt.bgPreview,
                  borderColor: opt.borderPreview,
                  color: opt.textPreview
                }}
              >
                {opt.emoji}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    {opt.label}
                    {isSelected && (
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.2 text-[10px] font-bold text-brand-400">
                        ACTIVE
                      </span>
                    )}
                  </p>
                  {isSelected && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {opt.sublabel}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-3 text-[11px] text-slate-300">
        💡 <strong className="text-brand-400">Eye-Care Recommendation:</strong> Use{' '}
        <strong className="text-white">Daylight White</strong> in bright or open-air storefronts with outdoor sunlight glare, or{' '}
        <strong className="text-white">Warm Eye-Care</strong> to reduce eye strain and blue-light fatigue during extended cashier shifts.
      </div>
    </div>
  )
}
