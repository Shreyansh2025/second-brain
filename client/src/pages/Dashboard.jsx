import { getResources, deleteResource } from '../services/resourceService.js'
import { useState, useEffect } from 'react'
import ResourceCard from '../components/ResourceCard'
import { useResources } from '../context/ResourceContext'
import { dummyResources } from '../data/dummyData'

const EMPTY_MESSAGES = {
  all:       { icon: 'ti-brain',         text: 'Your second brain is empty',   sub: 'Add your first resource to get started.' },
  youtube:   { icon: 'ti-brand-youtube', text: 'No YouTube videos saved',      sub: 'Paste a YouTube URL or use Screenshot mode.' },
  reels:     { icon: 'ti-device-mobile', text: 'No Instagram reels saved',     sub: 'Use the Reel tab to extract videos from a caption.' },
  links:     { icon: 'ti-link',          text: 'No links saved yet',           sub: 'Save articles, docs, or any URL.' },
  notes:     { icon: 'ti-file-text',     text: 'No notes yet',                 sub: 'Write your first note.' },
  favorites: { icon: 'ti-star',          text: 'No favorites yet',             sub: 'Star resources to find them quickly.' },
}

export default function Dashboard({ activeNav = 'all', searchQuery = '' , refreshKey = 0 }) {
  const { counts, refresh } = useResources()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  

  
  useEffect(() => {
    const fetchResources = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setResources(dummyResources)
        setLoading(false)
        return 
      } 
      try {
        setLoading(true)
        const params = {}
        if (activeNav === 'links')     { params.type = 'link' }
        if (activeNav === 'youtube')   { params.type = 'video'; params.platform = 'youtube' }
        if (activeNav === 'reels')     { params.type = 'video'; params.platform = 'instagram' }
        if (activeNav === 'notes')     { params.type = 'note' }
        if (activeNav === 'favorites') { params.isFavorite = true }
        if (activeNav.startsWith('tag:')) { params.tags = activeNav.replace('tag:', '') }
        if (searchQuery) { params.search = searchQuery }
        const res = await getResources(params)
        setResources(res.data.data)
      } catch {
        setError('Failed to fetch resources')
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [activeNav, searchQuery , refreshKey]) 

  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const params = {}
        if (activeNav === 'links') params.type = 'link'
        if (activeNav === 'youtube') { params.type = 'video'; params.platform = 'youtube' }
        if (activeNav === 'reels') { params.type = 'video'; params.platform = 'instagram' }
        if (activeNav === 'notes') params.type = 'note'
        if (activeNav === 'favorites') params.isFavorite = true
        if (activeNav.startsWith('tag:')) params.tags = activeNav.replace('tag:', '')
        const res = await getResources(params)
        setResources(res.data.data)
      } catch (err) {
        console.error('Auto refresh failed:', err)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [activeNav])

  const handleDelete = async (id) => {
    try {
      await deleteResource(id)
      setResources(prev => prev.filter(r => r._id !== id))
      refresh()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleFavoriteToggle = (id, isFavorite) => {
    setResources(prev => prev.map(r => r._id === id ? { ...r, isFavorite } : r))
    refresh()
  }

  const emptyState = EMPTY_MESSAGES[activeNav] ?? EMPTY_MESSAGES.all

  return (
    <div className="flex-1 p-6 overflow-y-auto">

      {/* Stats Row — always uses totals from context, never filtered data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total saved', value: counts.all,       color: '#e0e0e0' },
          { label: 'Videos',      value: counts.youtube + counts.reels, color: '#5DCAA5' },
          { label: 'Links',       value: counts.links,     color: '#9990e0' },
          { label: 'Notes',       value: counts.notes,     color: '#EF9F27' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
            <p className="text-[10px] text-[#444] mb-1">{stat.label}</p>
            <p className="text-lg font-medium" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {loading && (
        <p className="text-[#555] text-sm">Loading...</p>
      )}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {!loading && !error && resources.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <i className={`ti ${emptyState.icon} text-4xl text-[#2a2a2a]`} />
          <p className="text-sm text-[#444]">{emptyState.text}</p>
          <p className="text-xs text-[#333]">{emptyState.sub}</p>
        </div>
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onDelete={handleDelete}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

    </div>
  )
}
