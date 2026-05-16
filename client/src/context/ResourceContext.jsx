import { getResources, getTags } from '../services/resourceService'
import { dummyResources } from '../data/dummyData'
import { createContext, useContext, useState, useCallback , useEffect } from 'react'

const ResourceContext = createContext(null)

export function ResourceProvider({ children }) {
  const [allResources, setAllResources] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  
  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAllResources(dummyResources)
      setTags(['coding', 'self-help', 'career', 'discipline'])
      setLoading(false)
      return
    }
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

  useEffect(() => {
    refresh()
  }, [refresh])
  

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
