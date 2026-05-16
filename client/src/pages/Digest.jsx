import { useState, useEffect } from 'react'
import { getDailyDigest } from '../services/resourceService'
import ResourceCard from '../components/ResourceCard'
import { deleteResource, updateResource } from '../services/resourceService'

export default function Digest() {
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDailyDigest()
        setDigest(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleDelete = async (id) => {
    try {
      await deleteResource(id)
      setDigest(prev => ({
        ...prev,
        days: prev.days.map(day => ({
          ...day,
          items: day.items.filter(r => r._id !== id)
        })).filter(day => day.items.length > 0)
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleFavoriteToggle = (id, isFavorite) => {
    setDigest(prev => ({
      ...prev,
      days: prev.days.map(day => ({
        ...day,
        items: day.items.map(r => r._id === id ? { ...r, isFavorite } : r)
      }))
    }))
    updateResource(id, { isFavorite }).catch(console.error)
  }

  if (loading) return <div className="flex-1 p-6"><p className="text-[#555] text-sm">Loading...</p></div>

  return (
    <div className="flex-1 p-6 overflow-y-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium text-[#e0e0e0] mb-1">Weekly Digest</h1>
        <p className="text-xs text-[#555]">
          {digest?.total > 0
            ? `${digest.total} resources saved across ${digest.streak} day${digest.streak > 1 ? 's' : ''} this week`
            : 'Nothing saved in the last 7 days'
          }
        </p>
      </div>

      {/* Stats */}
      {digest?.total > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
            <p className="text-[10px] text-[#444] mb-1">Saved this week</p>
            <p className="text-2xl font-medium text-[#7F77DD]">{digest.total}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
            <p className="text-[10px] text-[#444] mb-1">Active days</p>
            <p className="text-2xl font-medium text-[#5DCAA5]">{digest.streak}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {digest?.total === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <i className="ti ti-calendar-off text-4xl text-[#2a2a2a]" />
          <p className="text-sm text-[#444]">Nothing saved this week</p>
          <p className="text-xs text-[#333]">Start adding resources to see your digest</p>
        </div>
      )}

      {/* Days */}
      {digest?.days.map((day) => (
        <div key={day.date} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-medium text-[#7F77DD]">{day.date}</p>
            <div className="flex-1 h-px bg-[#1e1e1e]" />
            <p className="text-[10px] text-[#444]">{day.count} saved</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {day.items.map(resource => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onDelete={handleDelete}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        </div>
      ))}

    </div>
  )
}