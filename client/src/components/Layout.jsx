import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import AddResourceModal from './AddResourceModal'
import { useResources } from '../context/ResourceContext'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { counts, tags, refresh } = useResources()
  const [activeNav, setActiveNav] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchDebounceRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchInputRef = useRef(null)
  const { logout } = useAuth()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable

      // Esc — close modal first, then clear search
      if (e.key === 'Escape') {
        if (showModal) {
          setShowModal(false)
          return
        }
        if (searchQuery) {
          setSearchQuery('')
          setDebouncedSearch('')
          searchInputRef.current?.blur()
          return
        }
      }

      // Ctrl+K — focus search bar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // N — open add resource modal (only when not typing anywhere)
      if (e.key === 'n' && !isTyping && !showModal) {
        e.preventDefault()
        setShowModal(true)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal, searchQuery])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
    }, 400)
  }

  const handleNavigate = (key) => {
    setActiveNav(key)
    setShowSidebar(false)
  }

  return (
    <div className="relative flex min-h-screen bg-[#0f0f0f]">

      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-full z-30 transition-transform duration-300
        md:relative md:translate-x-0 md:block
        ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          active={activeNav}
          onNavigate={handleNavigate}
          counts={counts}
          tags={tags}
          onLogout={logout}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        <div className="h-12 bg-[#141414] border-b border-[#222] flex items-center px-3 gap-2 flex-shrink-0">

          <button
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-md text-[#555] hover:text-[#888]"
            onClick={() => setShowSidebar(true)}
          >
            <i className="ti ti-menu-2 text-sm" />
          </button>

          <span className="text-sm font-medium text-[#e0e0e0] truncate">
            {activeNav === 'all' ? 'All resources' : activeNav.startsWith('tag:')
              ? `#${activeNav.replace('tag:', '')}`
              : activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
          </span>

          <div className="flex-1 max-w-xs ml-2 h-7 bg-[#1a1a1a] border border-[#242424] rounded-md hidden sm:flex items-center px-2 gap-2 focus-within:border-[#534AB7] transition-colors">
            <i className="ti ti-search text-[#444] text-xs" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search everything..."
              className="flex-1 bg-transparent text-xs text-[#ccc] placeholder-[#333] outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setDebouncedSearch('') }}>
                <i className="ti ti-x text-[#444] text-xs hover:text-[#888]" />
              </button>
            )}
          </div>

          <div className="ml-auto flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="h-7 px-2 sm:px-3 bg-[#7F77DD] rounded-md flex items-center gap-1 hover:bg-[#6e66cc] transition-colors"
            >
              <i className="ti ti-plus text-white text-xs" />
              <span className="text-xs text-white font-medium hidden sm:inline">Add resource</span>
            </button>
          </div>
        </div>

        {children({ activeNav, searchQuery: debouncedSearch })}
      </main>

      {showModal && (
        <AddResourceModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}
  