import { createContext, useContext, useState, useCallback } from 'react'
import { getResources, getTags } from '../services/resourceService'

const ResourceContext = createContext(null)

export function ResourceProvider({ children }) {
  const [allResources, setAllResources] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [resRes, tagsRes] = await Promise.all([
        getResources({ limit: 1000 }),
        getTags(),
      ])
      setAllResources(resRes.data.data)
      setTags(tagsRes.data.data)
    } catch (err) {
      console.error('ResourceContext refresh failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const counts = {
    all: allResources.length,
    links: allResources.filter(r => r.type === 'link').length,
    youtube: allResources.filter(r => r.type === 'video' && r.platform === 'youtube').length,
    reels: allResources.filter(r => r.type === 'video' && r.platform === 'instagram').length,
    notes: allResources.filter(r => r.type === 'note').length,
    favorites: allResources.filter(r => r.isFavorite).length,
  }

  return (
    <ResourceContext.Provider value={{ allResources, counts, tags, loading, refresh }}>
      {children}
    </ResourceContext.Provider>
  )
}

export const useResources = () => useContext(ResourceContext)
