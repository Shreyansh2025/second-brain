import { useState } from 'react'
import { updateResource } from '../services/resourceService'

function EditNoteModal({ resource, onClose, onSaved }) {
  const [title, setTitle] = useState(resource.title)
  const [body, setBody] = useState(resource.body || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.stopPropagation()
    if (!title.trim()) return
    setSaving(true)
    try {
      await updateResource(resource._id, { title: title.trim(), body: body.trim() })
      onSaved({ ...resource, title: title.trim(), body: body.trim() })
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md p-5 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#888]">Edit note</span>
          <button onClick={onClose}>
            <i className="ti ti-x text-[#444] hover:text-[#888] text-sm" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-[#444] uppercase tracking-widest">Title</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#111] border border-[#242424] rounded-lg px-3 py-2 text-sm text-[#ccc] outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-[#444] uppercase tracking-widest">Note</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            className="w-full bg-[#111] border border-[#242424] rounded-lg px-3 py-2 text-sm text-[#ccc] outline-none focus:border-[#534AB7] transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 h-8 bg-[#7F77DD] hover:bg-[#6e66cc] disabled:opacity-50 rounded-lg text-xs text-white font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="h-8 px-4 bg-[#222] hover:bg-[#2a2a2a] rounded-lg text-xs text-[#666] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResourceCard({ resource, onDelete, onFavoriteToggle }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isFav, setIsFav] = useState(resource.isFavorite)
  const [showEdit, setShowEdit] = useState(false)
  const [currentResource, setCurrentResource] = useState(resource)

  const handleFavorite = async (e) => {
    e.stopPropagation()
    try {
      await updateResource(currentResource._id, { isFavorite: !isFav })
      setIsFav(prev => !prev)
      if (onFavoriteToggle) onFavoriteToggle(currentResource._id, !isFav)
    } catch {
      // silent
    }
  }

  const handleEditSaved = (updated) => {
    setCurrentResource(updated)
    setShowEdit(false)
  }

  // Filter out any empty string tags
  const cleanTags = (currentResource.tags || []).filter(t => t && t.trim() !== '')

  return (
    <>
      {showEdit && (
        <EditNoteModal
          resource={currentResource}
          onClose={() => setShowEdit(false)}
          onSaved={handleEditSaved}
        />
      )}

      <div
        className="bg-[#1a1a1a] border border-[#1e1e1e] rounded-lg overflow-hidden cursor-pointer hover:border-[#2a2a2a] transition-colors relative"
        onClick={() => {
          if (confirmDelete) { setConfirmDelete(false); return }
          const url = currentResource.type === 'video'
            ? `https://www.youtube.com/watch?v=${currentResource.videoId}`
            : currentResource.url
          if (url) window.open(url, '_blank')
        }}
      >
        {/* Delete overlay — shown when confirmDelete is true */}
        {confirmDelete && (
          <div
            className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-3 rounded-lg"
            onClick={e => e.stopPropagation()}
          >
            <i className="ti ti-trash text-red-400 text-2xl" />
            <p className="text-white text-xs font-medium">Delete this resource?</p>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(currentResource._id)}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-[#888] text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="h-24 relative overflow-hidden">
          {currentResource.type === 'video' && currentResource.thumbnail ? (
            <>
              <img
                src={currentResource.thumbnail}
                alt={currentResource.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <i className="ti ti-player-play text-white text-3xl" />
              </div>
            </>
          ) : (
            <div className={`h-full flex items-center justify-center
              ${currentResource.type === 'link' ? 'bg-[#0d0d14]' : ''}
              ${currentResource.type === 'note' ? 'bg-[#141009]' : ''}
              ${currentResource.type === 'video' ? 'bg-[#0d0f0d]' : ''}
            `}>
              {currentResource.type === 'link' && <i className="ti ti-link text-[#1a1a3a] text-3xl" />}
              {currentResource.type === 'note' && <i className="ti ti-file-text text-[#2a2010] text-3xl" />}
              {currentResource.type === 'video' && <i className="ti ti-player-play text-[#1a4030] text-3xl" />}
            </div>
          )}

          {/* Type Badge */}
          <span className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium
            ${currentResource.type === 'video' && currentResource.platform === 'youtube' ? 'bg-[#0d2010] text-[#5DCAA5]' : ''}
            ${currentResource.type === 'video' && currentResource.platform === 'instagram' ? 'bg-[#1a0d1e] text-[#D4537E]' : ''}
            ${currentResource.type === 'link' ? 'bg-[#0d0d24] text-[#9990e0]' : ''}
            ${currentResource.type === 'note' ? 'bg-[#1a1209] text-[#EF9F27]' : ''}
          `}>
            {currentResource.type === 'video' ? currentResource.platform : currentResource.type}
          </span>

          {/* Favorite Star */}
          <i
            className={`ti ti-star absolute bottom-1.5 right-1.5 text-sm cursor-pointer transition-colors
              ${isFav ? 'text-[#EF9F27]' : 'text-[#333] hover:text-[#EF9F27]'}`}
            onClick={handleFavorite}
          />
        </div>

        {/* Card Body */}
        <div className="p-3">
          <p className="text-xs font-medium text-[#bbb] mb-1 truncate">
            {currentResource.title}
          </p>
          <p className="text-[10px] text-[#444] mb-2 truncate">
            {currentResource.type === 'video' &&
              `${currentResource.channel || ''}${currentResource.duration ? ' · ' + currentResource.duration : ''}`}
            {currentResource.type === 'link' && currentResource.siteName}
            {currentResource.type === 'note' && currentResource.body}
          </p>

          {/* Tags — empty strings filtered out */}
          {cleanTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {cleanTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e1e1e] text-[#555]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#333]">
              {new Date(currentResource.createdAt).toLocaleDateString()}
            </span>
            <div className="flex gap-1 items-center">
              {currentResource.type === 'video' && (
                <i className="ti ti-brand-youtube text-[#444] text-xs cursor-pointer hover:text-[#5DCAA5]" />
              )}
              {currentResource.type === 'link' && (
                <i className="ti ti-external-link text-[#444] text-xs cursor-pointer hover:text-[#9990e0]" />
              )}
              {currentResource.type === 'note' && (
                <i
                  className="ti ti-edit text-[#444] text-xs cursor-pointer hover:text-[#EF9F27]"
                  onClick={(e) => { e.stopPropagation(); setShowEdit(true) }}
                />
              )}

              <i
                className="ti ti-trash text-[#444] text-xs cursor-pointer hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(true)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}