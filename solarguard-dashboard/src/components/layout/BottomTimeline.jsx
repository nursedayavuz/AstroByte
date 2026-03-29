import { useState, useMemo } from 'react'

const TIME_LABELS = ['-72h', '-48h', '-24h', '-12h', '-6h', 'CANLI']

const EVENTS_ON_TRACK = [
  { position: 92, type: 'X', label: 'X8.1' },
  { position: 93, type: 'X', label: 'X2.8' },
  { position: 70, type: 'M', label: 'M7.3' },
  { position: 85, type: 'M', label: 'M6.7' },
  { position: 60, type: 'C', label: 'C4.5' },
  { position: 96, type: 'X', label: 'X4.2' },
]

export default function BottomTimeline() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(95)

  return (
    <div
      className="fixed bottom-0 left-0 w-full flex items-center"
      style={{
        height: 64,
        zIndex: 50,
        background: 'rgba(5, 6, 15, 0.9)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 140, 66, 0.3)',
      }}
    >
      {/* LEFT */}
      <div className="flex flex-col items-center justify-center" style={{ width: 140 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--orange)' }}>history</span>
        <span className="font-data" style={{ fontSize: 9, color: 'var(--orange)', textTransform: 'uppercase' }}>
          OLAY ZAMAN ÇİZGİSİ
        </span>
      </div>

      {/* CENTER */}
      <div className="flex-1 flex items-center gap-4 px-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-accent)', background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>skip_previous</span>
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--cyan)',
              color: '#000',
              cursor: 'pointer',
              boxShadow: '0 0 15px var(--cyan-strong-glow)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-accent)', background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>skip_next</span>
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 relative" style={{ height: 24 }}>
          {/* Time Labels */}
          <div className="flex justify-between" style={{ position: 'absolute', top: -2, left: 0, right: 0 }}>
            {TIME_LABELS.map(label => (
              <span key={label} className="font-data" style={{
                fontSize: 8,
                color: label === 'CANLI' ? 'var(--cyan)' : 'var(--text-dim)',
                fontWeight: label === 'CANLI' ? 700 : 400,
              }}>
                {label}
              </span>
            ))}
          </div>

          {/* Track */}
          <div style={{
            position: 'absolute',
            top: 14,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
          }}>
            {/* Progress Fill */}
            <div style={{
              height: '100%',
              width: `${position}%`,
              background: 'var(--cyan)',
              borderRadius: 1,
              boxShadow: '0 0 8px var(--cyan-glow)',
            }} />
          </div>

          {/* Event Markers */}
          {EVENTS_ON_TRACK.map((evt, i) => {
            const colors = { X: 'var(--red)', M: 'var(--orange)', C: 'var(--alert-yellow)' }
            const sizes = { X: 8, M: 6, C: 4 }
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${evt.position}%`,
                  top: 14 - sizes[evt.type] / 2 + 1,
                  width: sizes[evt.type],
                  height: sizes[evt.type],
                  borderRadius: '50%',
                  background: colors[evt.type],
                  boxShadow: `0 0 4px ${colors[evt.type]}`,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
                title={evt.label}
              />
            )
          })}

          {/* Handle */}
          <div
            style={{
              position: 'absolute',
              left: `${position}%`,
              top: 14 - 6,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid var(--cyan)',
              cursor: 'pointer',
              transform: 'translateX(-50%)',
              transition: 'transform 0.15s',
              zIndex: 3,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(-50%)'}
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4" style={{ width: 200, paddingRight: 16 }}>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Senkronizasyon</span>
        <div className="flex items-center gap-2">
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)', boxShadow: '0 0 8px var(--green)',
            animation: 'pulse-cyan 2s ease-in-out infinite',
          }} />
          <span className="font-data" style={{ fontSize: 9, color: 'var(--green)' }}>SİSTEM AKTİF</span>
        </div>
      </div>
    </div>
  )
}
