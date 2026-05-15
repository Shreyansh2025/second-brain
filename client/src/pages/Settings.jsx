import { useState } from 'react'
import { useResources } from '../context/ResourceContext'

const SHORTCUTS = [
  { keys: ['N'], desc: 'Add new resource' },
  { keys: ['Ctrl', 'K'], desc: 'Focus search bar' },
  { keys: ['Esc'], desc: 'Close modal / clear search' },
]

const STACK = [
  { label: 'Frontend', value: 'React + Vite + Tailwind v4' },
  { label: 'Backend', value: 'Node.js + Express 5' },
  { label: 'Database', value: 'MongoDB + Mongoose' },
  { label: 'AI (auto-tag)', value: 'Groq — LLaMA 3.1 8B' },
  { label: 'OCR', value: 'Tesseract.js' },
  { label: 'Image storage', value: 'Cloudinary' },
  { label: 'Video search', value: 'YouTube Data API v3' },
]

export default function Settings() {
  const { counts } = useResources()
  const totalVideos = (counts.youtube || 0) + (counts.reels || 0)
  const [copied, setCopied] = useState(false)

  const handleExportInfo = () => {
    const info = `Second Brain — Data Summary\n\nTotal resources: ${counts.all || 0}\nYouTube videos: ${counts.youtube || 0}\nInstagram reels: ${counts.reels || 0}\nLinks: ${counts.links || 0}\nNotes: ${counts.notes || 0}\nFavorites: ${counts.favorites || 0}\n\nExported on: ${new Date().toLocaleString()}`
    navigator.clipboard.writeText(info).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium text-[#e0e0e0] mb-1">Settings</h1>
        <p className="text-xs text-[#444]">Your Second Brain configuration and stats</p>
      </div>

      {/* Stats */}
      <section className="mb-6">
        <p className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Your library</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total saved',  value: counts.all || 0,      color: '#e0e0e0' },
            { label: 'Videos',       value: totalVideos,           color: '#5DCAA5' },
            { label: 'Links',        value: counts.links || 0,     color: '#9990e0' },
            { label: 'Notes',        value: counts.notes || 0,     color: '#EF9F27' },
            { label: 'Favorites',    value: counts.favorites || 0, color: '#D4537E' },
            { label: 'Reels',        value: counts.reels || 0,     color: '#7F77DD' },
          ].map((s) => (
            <div key={s.label} className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
              <p className="text-[10px] text-[#444] mb-1">{s.label}</p>
              <p className="text-base font-medium" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleExportInfo}
          className="mt-3 flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#222] rounded-lg text-xs text-[#555] hover:text-[#888] hover:border-[#333] transition-colors"
        >
          <i className={`ti ${copied ? 'ti-check text-[#5DCAA5]' : 'ti-clipboard'} text-xs`} />
          {copied ? 'Copied to clipboard!' : 'Copy stats summary'}
        </button>
      </section>

      <div className="h-px bg-[#1e1e1e] mb-6" />

      {/* Keyboard shortcuts */}
      <section className="mb-6">
        <p className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Keyboard shortcuts</p>
        <div className="bg-[#1a1a1a] border border-[#222] rounded-lg overflow-hidden">
          {SHORTCUTS.map((s, i) => (
            <div
              key={s.desc}
              className={`flex items-center justify-between px-4 py-3 ${i < SHORTCUTS.length - 1 ? 'border-b border-[#222]' : ''}`}
            >
              <span className="text-xs text-[#888]">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 bg-[#111] border border-[#2a2a2a] rounded text-[10px] text-[#666] font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#333] mt-2 px-1">More shortcuts coming soon.</p>
      </section>

      <div className="h-px bg-[#1e1e1e] mb-6" />

      {/* Tech stack */}
      <section className="mb-6">
        <p className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Tech stack</p>
        <div className="bg-[#1a1a1a] border border-[#222] rounded-lg overflow-hidden">
          {STACK.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center justify-between px-4 py-3 ${i < STACK.length - 1 ? 'border-b border-[#222]' : ''}`}
            >
              <span className="text-[10px] text-[#444] uppercase tracking-wide">{item.label}</span>
              <span className="text-xs text-[#888]">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-[#1e1e1e] mb-6" />

      {/* About */}
      <section className="mb-6">
        <p className="text-[10px] text-[#444] uppercase tracking-widest mb-3">About</p>
        <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#7F77DD] rounded-md flex items-center justify-center flex-shrink-0">
              <i className="ti ti-brain text-white text-xs" />
            </div>
            <span className="text-sm text-[#e0e0e0] font-medium">Second Brain</span>
            <span className="text-[10px] text-[#444] ml-auto">v1.0</span>
          </div>
          <p className="text-xs text-[#555] leading-relaxed">
            Your personal knowledge hub. Save YouTube videos, Instagram reels,
            links, and notes — all in one place, automatically tagged by AI.
          </p>
          <div className="pt-1 flex items-center gap-1 text-[10px] text-[#333]">
            <i className="ti ti-heart text-[#D4537E] text-xs" />
            <span>Built with MERN stack</span>
          </div>
        </div>
      </section>

      {/* What to add next hint */}
      <section>
        <p className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Upcoming features</p>
        <div className="bg-[#1a1a1a] border border-[#222] rounded-lg overflow-hidden">
          {[
            { icon: 'ti-user', label: 'User login & accounts', status: 'planned' },
            { icon: 'ti-bell', label: 'Daily digest email', status: 'planned' },
            { icon: 'ti-archive', label: 'Export library as JSON', status: 'planned' },
            { icon: 'ti-device-mobile', label: 'Mobile app (PWA)', status: 'planned' },
          ].map((f, i, arr) => (
            <div
              key={f.label}
              className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#222]' : ''}`}
            >
              <i className={`ti ${f.icon} text-sm text-[#444]`} />
              <span className="text-xs text-[#555] flex-1">{f.label}</span>
              <span className="text-[10px] text-[#333] bg-[#111] border border-[#222] px-2 py-0.5 rounded-full">
                {f.status}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
