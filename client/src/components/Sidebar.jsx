const navItems = [
  { icon: 'ti-layout-dashboard', label: 'All resources', key: 'all' },
  { icon: 'ti-link', label: 'Links', key: 'links' },
  { icon: 'ti-brand-youtube', label: 'YouTube', key: 'youtube' },
  { icon: 'ti-brand-instagram', label: 'Reels', key: 'reels' },
  { icon: 'ti-file-text', label: 'Notes', key: 'notes' },
  { icon: 'ti-star', label: 'Favorites', key: 'favorites' },
  { icon: 'ti-calendar-week', label: 'Weekly digest', key: 'digest' },
]

const tagColors = ['#7F77DD', '#1D9E75', '#EF9F27', '#D4537E', '#5DCAA5']

export default function Sidebar({ active, onNavigate, counts = {}, tags = [], onLogout }) {
  return (
    <aside className="w-50 h-screen bg-[#141414] border-r border-[#222] flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#222] flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 bg-[#7F77DD] rounded-md flex items-center justify-center">
          <i className="ti ti-brain text-white text-xs" />
        </div>
        <span className="text-[#e0e0e0] text-sm font-medium">Second Brain</span>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Nav items */}
        <div className="px-2 pt-3 pb-1">
          <p className="text-[10px] text-[#444] uppercase tracking-widest px-2 mb-1">Library</p>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-2 px-3 py-1.75 rounded-md mb-px text-left transition-colors
                ${active === item.key
                  ? 'bg-[#1e1e2e] text-[#c0bef0]'
                  : 'text-[#555] hover:bg-[#1a1a1a] hover:text-[#888]'
                }`}
            >
              <i className={`ti ${item.icon} text-sm ${active === item.key ? 'text-[#7F77DD]' : 'text-[#555]'}`} />
              <span className="text-xs">{item.label}</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full
                ${active === item.key
                  ? 'bg-[#2a2a3e] text-[#9990e0]'
                  : 'bg-[#1a1a1a] text-[#444]'
                }`}
              >
                {counts[item.key] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="h-px bg-[#1e1e1e] mx-3 my-2" />

        {/* Tags */}
        <div className="px-2 pb-2">
          <p className="text-[10px] text-[#444] uppercase tracking-widest px-2 mb-1">Tags</p>
          {tags.length === 0 && (
            <p className="text-[10px] text-[#333] px-3 py-1">No tags yet</p>
          )}
          {tags.map((tag, index) => (
            <button
              key={tag}
              onClick={() => onNavigate(`tag:${tag}`)}
              className={`w-full flex items-center gap-2 px-3 py-1.25 rounded-md text-left transition-colors
                ${active === `tag:${tag}` ? 'bg-[#1e1e2e]' : 'hover:bg-[#1a1a1a]'}`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: tagColors[index % tagColors.length] }}
              />
              <span className={`text-xs truncate ${active === `tag:${tag}` ? 'text-[#c0bef0]' : 'text-[#555]'}`}>
                {tag}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* Bottom — always visible, never scrolls */}
      <div className="shrink-0 px-2 py-3 border-t border-[#1e1e1e]">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left transition-colors mb-1
            ${active === 'settings' ? 'bg-[#1e1e2e] text-[#c0bef0]' : 'text-[#555] hover:bg-[#1a1a1a] hover:text-[#888]'}`}
        >
          <i className={`ti ti-settings text-sm ${active === 'settings' ? 'text-[#7F77DD]' : 'text-[#555]'}`} />
          <span className="text-xs">Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left text-[#555] hover:bg-[#1a1a1a] hover:text-red-400 transition-colors"
        >
          <i className="ti ti-logout text-sm" />
          <span className="text-xs">Sign out</span>
        </button>
      </div>

    </aside>
  )
}