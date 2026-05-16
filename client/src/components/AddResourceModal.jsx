import { useState, useRef } from 'react'
import {
  createResource,
  uploadImage,
  processScreenshot,
  processReel,
  saveReelVideos,
  autoTag,
  getYoutubeDetails,
} from '../services/resourceService'

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm z-50 shadow-lg
      ${toast.type === 'error' ? 'bg-red-900/80 text-red-200' : 'bg-[#1D9E75]/20 text-[#5DCAA5]'}`}>
      {toast.msg}
    </div>
  )
}

export default function AddResourceModal({ onClose, onSaved }) {
  const [tab, setTab] = useState('manual')
  const [type, setType] = useState('link')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ title: '', url: '', body: '', tags: '' })
  const [toast, setToast] = useState(null)

  const [imageFiles, setImageFiles] = useState([])
  const [screenshotResults, setScreenshotResults] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [fetchingVideo, setFetchingVideo] = useState(false)
  const [reelCaption, setReelCaption] = useState('')
  const [reelResults, setReelResults] = useState(null)
  const [selectedReelVideos, setSelectedReelVideos] = useState([])
  const debounceRef = useRef(null)

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getAutoTags = async (title, description) => {
    try {
      const res = await autoTag({ title, description })
      return res.data.data.tags
    } catch {
      return []
    }
  }

  const handleManualSave = async () => {
    try {
      setLoading(true)
      const aiTags = await getAutoTags(formData.title, formData.url || formData.body)
      const manualTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      const tags = [...new Set([...manualTags, ...aiTags])]

      const payload = { type, title: formData.title, tags }

      if (type === 'link') {
        payload.url = formData.url
        payload.siteName = new URL(formData.url).hostname
      }
      if (type === 'video') {
        if (videoPreview) {
          payload.videoId = videoPreview.videoId
          payload.title = videoPreview.title
          payload.channel = videoPreview.channel
          payload.thumbnail = videoPreview.thumbnail
          payload.url = videoPreview.url
          payload.platform = 'youtube'
        } else {
          payload.url = formData.url
          payload.platform = formData.url.includes('instagram') ? 'instagram' : 'youtube'
          payload.title = formData.title || formData.url
        }
      }
      if (type === 'note') {
        payload.body = formData.body
      }
      await createResource(payload)
      onSaved()
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong'
      showToast(message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlChange = (e) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, url }))
    setVideoPreview(null)
    clearTimeout(debounceRef.current)

    if (type === 'video' && (url.includes('youtube.com/watch') || url.includes('youtu.be'))) {
      debounceRef.current = setTimeout(async () => {
        try {
          setFetchingVideo(true)
          const res = await getYoutubeDetails({ url })
          setVideoPreview(res.data.data)
          setFormData(prev => ({ ...prev, title: res.data.data.title }))
        } catch { /* silently fail */ }
        finally { setFetchingVideo(false) }
      }, 600)
    }
  }

  const handleScreenshotUpload = async () => {
    if (!imageFiles || imageFiles.length === 0) return showToast('Please select at least one image')
    try {
      setLoading(true)
      const allVideos = []
      const seenIds = new Set()

      for (const file of imageFiles) {
        const form = new FormData()
        form.append('image', file)
        const uploadRes = await uploadImage(form)
        const imageUrl = uploadRes.data.data.imageUrl
        const processRes = await processScreenshot({ imageUrl })
        const videos = processRes.data.data.videos || []
        for (const video of videos) {
          if (!seenIds.has(video.videoId)) {
            seenIds.add(video.videoId)
            allVideos.push(video)
          }
        }
      }
console.log('allVideos before set:', allVideos)
console.log('allVideos length:', allVideos.length)
setScreenshotResults({ videos: allVideos })
setSelectedReelVideos(allVideos.map(v => v.videoId))
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed. Check console.'
      showToast(message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleScreenshotSave = async () => {
  if (selectedReelVideos.length === 0) return alert('Please select at least one video')
  try {
    setLoading(true)
    const videosToSave = screenshotResults.videos.filter(v =>
      selectedReelVideos.includes(v.videoId)
    )
    console.log('Videos to save:', videosToSave)  // ← add this
    await saveReelVideos({ videos: videosToSave, tags: [] })
    onSaved()
  } catch (error) {
    const message = error.response?.data?.message || 'Save failed'
    alert(message)
    console.error(error)
  } finally {
    setLoading(false)
  }
}

  const handleReelProcess = async () => {
    if (!reelCaption) return showToast('Please paste the reel caption first')
    try {
      setLoading(true)
      const res = await processReel({ caption: reelCaption })
      setReelResults(res.data.data.videos)
      setSelectedReelVideos(res.data.data.videos.map(v => v.videoId))
    } catch (error) {
      showToast('Processing failed.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleReelSave = async () => {
    try {
      setLoading(true)
      const videosToSave = reelResults.filter(v => selectedReelVideos.includes(v.videoId))
      await saveReelVideos({ videos: videosToSave, tags: [] })
      onSaved()
    } catch (error) {
      showToast('Save failed.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReelVideo = (videoId) => {
    setSelectedReelVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    )
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#e0e0e0]">Add resource</h2>
            <button onClick={onClose}>
              <i className="ti ti-x text-[#555] hover:text-[#888]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {['manual', 'screenshot', 'reel'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                  ${tab === t
                    ? 'bg-[#1e1e2e] border-[#534AB7] text-[#9990e0]'
                    : 'border-[#2a2a2a] text-[#555] hover:border-[#444]'
                  }`}
              >
                {t === 'manual' && '✏️ Manual'}
                {t === 'screenshot' && '📸 Screenshot'}
                {t === 'reel' && '🎬 Reel'}
              </button>
            ))}
          </div>

          {/* MANUAL TAB */}
          {tab === 'manual' && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {['link', 'video', 'note'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors
                      ${type === t
                        ? 'bg-[#1e1e2e] border-[#534AB7] text-[#9990e0]'
                        : 'border-[#2a2a2a] text-[#555]'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {(type === 'link' || type === 'note') && (
                <input name="title" value={formData.title} onChange={handleChange}
                  placeholder="Title"
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7]"
                />
              )}
              {(type === 'link' || type === 'video') && (
                <div className="relative">
                  <input
                    name="url"
                    value={formData.url}
                    onChange={type === 'video' ? handleUrlChange : handleChange}
                    placeholder={type === 'video' ? 'Paste YouTube URL' : 'URL'}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7]"
                  />
                  {fetchingVideo && (
                    <p className="text-[10px] text-[#7F77DD] mt-1">Fetching video details...</p>
                  )}
                </div>
              )}
              {type === 'video' && videoPreview && (
                <div className="flex gap-3 p-2 rounded-lg border border-[#534AB7] bg-[#1e1e2e]">
                  <img
                    src={videoPreview.thumbnail}
                    className="w-20 h-12 rounded object-cover flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs text-[#ccc] font-medium line-clamp-2">
                      {videoPreview.title}
                    </p>
                    <p className="text-[10px] text-[#555]">{videoPreview.channel}</p>
                  </div>
                </div>
              )}
              {type === 'note' && (
                <textarea name="body" value={formData.body} onChange={handleChange}
                  placeholder="Write your note..." rows={4}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7] resize-none"
                />
              )}
              <input name="tags" value={formData.tags} onChange={handleChange}
                placeholder="Tags (optional — AI will auto-suggest)"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7]"
              />
              <p className="text-[10px] text-[#444]">✨ AI will automatically suggest tags</p>

              <div className="flex justify-end gap-2 mt-2">
                <button onClick={onClose}
                  className="text-xs px-4 py-2 rounded-lg border border-[#2a2a2a] text-[#555] hover:text-[#888]">
                  Cancel
                </button>
                <button onClick={handleManualSave} disabled={loading}
                  className="text-xs px-4 py-2 rounded-lg bg-[#7F77DD] text-white hover:bg-[#6e66cc] disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* SCREENSHOT TAB */}
          {tab === 'screenshot' && (
            <div className="flex flex-col gap-3">
              {!screenshotResults ? (
                <>
                  <label className="border border-dashed border-[#2a2a2a] rounded-lg p-6 text-center cursor-pointer hover:border-[#534AB7] hover:bg-[#111] transition-colors block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setImageFiles(Array.from(e.target.files))}
                      className="hidden"
                    />
                    <i className="ti ti-upload text-[#444] text-2xl mb-2 block" />
                    <p className="text-xs text-[#555] mb-1">
                      Click anywhere here to select screenshots
                    </p>
                    <p className="text-[10px] text-[#444] mb-2">
                      Works with YouTube screenshots, Instagram carousels, paused reels
                    </p>
                    {imageFiles && imageFiles.length > 0 ? (
                      <p className="text-xs text-[#7F77DD] font-medium">
                        ✓ {imageFiles.length} file{imageFiles.length > 1 ? 's' : ''} selected — ready to upload
                      </p>
                    ) : (
                      <p className="text-xs text-[#534AB7] font-medium">
                        Tap to choose files
                      </p>
                    )}
                  </label>
                  <button
                    onClick={handleScreenshotUpload}
                    disabled={loading}
                    className="w-full text-xs py-2 rounded-lg bg-[#7F77DD] text-white hover:bg-[#6e66cc] disabled:opacity-50"
                  >
                    {loading ? 'Processing... (may take ~15 seconds per image)' : 'Upload & Extract'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#555]">
                    Select videos to save ({selectedReelVideos.length} selected):
                  </p>
                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                    {screenshotResults.videos.map((video) => (
                      <div
                        key={video.videoId}
                        onClick={() => toggleReelVideo(video.videoId)}
                        className={`flex gap-3 p-2 rounded-lg border cursor-pointer transition-colors
                          ${selectedReelVideos.includes(video.videoId)
                            ? 'border-[#534AB7] bg-[#1e1e2e]'
                            : 'border-[#2a2a2a] hover:border-[#444]'
                          }`}
                      >
                        <img src={video.thumbnail} className="w-20 h-12 rounded object-cover flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-[#ccc] font-medium line-clamp-2">{video.title}</p>
                          <p className="text-[10px] text-[#555]">{video.channel}</p>
                        </div>
                        <i className={`ti text-sm mt-1 flex-shrink-0
                          ${selectedReelVideos.includes(video.videoId)
                            ? 'ti-circle-check text-[#7F77DD]'
                            : 'ti-circle text-[#333]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between gap-2 mt-2">
                    <button
                      onClick={() => { setScreenshotResults(null); setSelectedReelVideos([]) }}
                      className="text-xs px-4 py-2 rounded-lg border border-[#2a2a2a] text-[#555]"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleScreenshotSave}
                      disabled={loading || selectedReelVideos.length === 0}
                      className="text-xs px-4 py-2 rounded-lg bg-[#7F77DD] text-white disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : `Save ${selectedReelVideos.length} video${selectedReelVideos.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* REEL TAB */}
          {tab === 'reel' && (
            <div className="flex flex-col gap-3">
              {!reelResults ? (
                <>
                  <p className="text-xs text-[#555] mb-1">
                    How to get the caption:
                  </p>
                  <ol className="text-[10px] text-[#444] list-decimal pl-4 mb-2 space-y-1">
                    <li>Open the Instagram reel</li>
                    <li>Tap the three dots (···) on the reel</li>
                    <li>Tap "Copy caption" or manually select and copy the text</li>
                    <li>Paste it below</li>
                  </ol>
                  <textarea
                    value={reelCaption}
                    onChange={(e) => setReelCaption(e.target.value)}
                    placeholder="Paste reel caption here..."
                    rows={5}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7] resize-none"
                  />
                  <button onClick={handleReelProcess} disabled={loading}
                    className="w-full text-xs py-2 rounded-lg bg-[#7F77DD] text-white disabled:opacity-50">
                    {loading ? 'Extracting videos...' : 'Extract Videos'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#555]">
                    Select videos to save ({selectedReelVideos.length} selected):
                  </p>
                  <div className="flex flex-col gap-2">
                    {reelResults.map((video) => (
                      <div
                        key={video.videoId}
                        onClick={() => toggleReelVideo(video.videoId)}
                        className={`flex gap-3 p-2 rounded-lg border cursor-pointer transition-colors
                          ${selectedReelVideos.includes(video.videoId)
                            ? 'border-[#534AB7] bg-[#1e1e2e]'
                            : 'border-[#2a2a2a] hover:border-[#444]'
                          }`}
                      >
                        <img src={video.thumbnail} className="w-20 h-12 rounded object-cover" />
                        <div className="flex-1">
                          <p className="text-xs text-[#ccc] font-medium line-clamp-2">{video.title}</p>
                          <p className="text-[10px] text-[#555]">{video.channel}</p>
                        </div>
                        <i className={`ti text-sm mt-1 flex-shrink-0
                          ${selectedReelVideos.includes(video.videoId)
                            ? 'ti-circle-check text-[#7F77DD]'
                            : 'ti-circle text-[#333]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between gap-2 mt-2">
                    <button onClick={() => setReelResults(null)}
                      className="text-xs px-4 py-2 rounded-lg border border-[#2a2a2a] text-[#555]">
                      ← Back
                    </button>
                    <button onClick={handleReelSave} disabled={loading || selectedReelVideos.length === 0}
                      className="text-xs px-4 py-2 rounded-lg bg-[#7F77DD] text-white disabled:opacity-50">
                      {loading ? 'Saving...' : `Save ${selectedReelVideos.length} videos`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
