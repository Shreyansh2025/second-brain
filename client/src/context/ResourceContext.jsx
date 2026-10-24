import { useState, useCallback, useEffect } from 'react'
import { getResources, getTags } from '../services/resourceService'
import { dummyResources } from '../data/dummyData'
import { ResourceContext } from './resource-context.js'

const DEFAULT_TAGS = ['coding', 'self-help', 'career', 'discipline']

const hasToken = () => Boolean(localStorage.getItem('token'))

async function fetchResourceData() {
  const [resourcesResponse, tagsResponse] = await Promise.all([
    getResources({ limit: 1000 }),
    getTags(),
  ])

  return {
    resources: resourcesResponse.data.data,
    tags: tagsResponse.data.data,
  }
}

export function ResourceProvider({ children }) {
  const [allResources, setAllResources] = useState(() =>
    hasToken() ? [] : dummyResources
  )

  const [tags, setTags] = useState(() =>
    hasToken() ? [] : DEFAULT_TAGS
  )

  const [loading, setLoading] = useState(() => hasToken())

  const refresh = useCallback(async () => {
    if (!hasToken()) {
      setAllResources(dummyResources)
      setTags(DEFAULT_TAGS)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const data = await fetchResourceData()

      setAllResources(data.resources)
      setTags(data.tags)
    } catch (err) {
      console.error('ResourceContext refresh failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasToken()) return

    let active = true

    fetchResourceData()
      .then(({ resources, tags: fetchedTags }) => {
        if (!active) return

        setAllResources(resources)
        setTags(fetchedTags)
      })
      .catch((err) => {
        if (active) {
          console.error('ResourceContext initial load failed:', err)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const counts = {
    all: allResources.length,
    links: allResources.filter((r) => r.type === 'link').length,
    youtube: allResources.filter(
      (r) => r.type === 'video' && r.platform === 'youtube'
    ).length,
    reels: allResources.filter(
      (r) => r.type === 'video' && r.platform === 'instagram'
    ).length,
    notes: allResources.filter((r) => r.type === 'note').length,
    favorites: allResources.filter((r) => r.isFavorite).length,
  }

  return (
    <ResourceContext.Provider
      value={{ allResources, counts, tags, loading, refresh }}
    >
      {children}
    </ResourceContext.Provider>
  )
}