import Resource from '../models/Resource.js'
import Groq from 'groq-sdk'
import { decodeHtml } from '../utils/decodeHtml.js'
import { searchYouTube } from '../utils/youtube.js'
import { getWorker } from '../utils/tesseractWorker.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const askGroq = async (prompt) => {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
  })
  return completion.choices[0].message.content.trim()
}

// CREATE
export const createResource = async (req, res) => {
  try {
    const { type, title, description, url, body, tags, platform,
            videoId, channel, thumbnail, siteName, imageUrl,
            extractedText, customType } = req.body

    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'type and title are required' })
    }

    const resource = await Resource.create({
      userId: req.user?.id,
      type, title, description, url, body, tags: tags ?? [],
      platform, videoId, channel, thumbnail, siteName,
      imageUrl, extractedText, customType,
      isFavorite: false,
    })
    res.status(201).json({ success: true, data: resource })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// GET ALL (with pagination + regex search)
export const getResources = async (req, res) => {
  try {
    const { type, platform, tags, isFavorite, search, page = 1, limit = 30 } = req.query
    let filter = {}
    if (type) filter.type = type
    if (platform) filter.platform = platform
    if (isFavorite) filter.isFavorite = isFavorite === 'true'
    if (tags) filter.tags = { $in: tags.split(',') }

    // Regex search — matches partial words, case-insensitive
    // This fixes the issue where "How to" returned no results because
    // MongoDB $text search ignores stop words like "to", "a", "the"
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = { $regex: escaped, $options: 'i' }
      filter.$or = [
        { title: regex },
        { description: regex },
        { channel: regex },
        { body: regex },
        { tags: regex },
        { extractedText: regex },
        { siteName: regex },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [resources, total] = await Promise.all([
      Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Resource.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      data: resources,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// GET ONE
export const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }
    res.status(200).json({ success: true, data: resource })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// UPDATE
export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }
    res.status(200).json({ success: true, data: resource })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// DELETE
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id)
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' })
    }
    res.status(200).json({ success: true, message: 'Resource deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// UPLOAD IMAGE
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }
    res.status(200).json({
      success: true,
      data: {
        imageUrl: req.file.path,
        publicId: req.file.filename,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// EXTRACT TEXT FROM IMAGE
export const extractText = async (req, res) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'No image URL provided' })
    }
    const w = await getWorker()
    const { data: { text } } = await w.recognize(imageUrl)
    res.status(200).json({
      success: true,
      data: { extractedText: text.trim() }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// SEARCH YOUTUBE
export const searchYoutube = async (req, res) => {
  try {
    const { query } = req.body
    if (!query) {
      return res.status(400).json({ success: false, message: 'No search query provided' })
    }
    const videos = await searchYouTube(query, 5)
    res.status(200).json({ success: true, data: videos })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// FULL SCREENSHOT PIPELINE
export const processScreenshot = async (req, res) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'No image URL provided' })
    }

    // Step 1 — OCR (reuse persistent worker)
    const w = await getWorker()
    const { data: { text } } = await w.recognize(imageUrl)
    const extractedText = text.trim()

    // Step 2 — Extract title with Groq (with fallback)
    let titleLine
    try {
      const groqResponse = await askGroq(`
        This is OCR text from an Instagram post showing a YouTube video recommendation card.
        
        IGNORE these completely:
        - Instagram UI text (likes, comments, shares)
        - Background music/song names (usually after a music note symbol ♪ or "J1")
        - Hashtags (#personalgrowth etc)
        - Text like "COMMENT W FOR THE LINKS"
        - The large numbered heading (like "1. VOIDED THOUGHTS")
        
        FIND these from inside the YouTube video card only:
        - The video title (sentence-case text inside the card)
        - The channel name (appears below the title with view count)
        
        Return ONLY: {"title": "video title", "channel": "channel name"}
        No explanation, no markdown.
        
        OCR text: ${extractedText}
      `)
      const cleaned = groqResponse.replace(/```json|```/g, '').trim()
      const { title: extractedTitle, channel: extractedChannel } = JSON.parse(cleaned)
      titleLine = extractedChannel
        ? `${extractedTitle.split('|')[0].trim()} ${extractedChannel}`
        : extractedTitle.split('|')[0].trim()
    } catch (groqError) {
      console.error('Groq failed, using pattern fallback')
      const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 3)
      const viewsLineIndex = lines.findIndex(l =>
        /\d+(\.\d+)?[KMB]\s*(views|ago)/i.test(l) ||
        /[▷►]\s*\d+(\.\d+)?[KMB]/i.test(l)
      )
      titleLine = viewsLineIndex > 1
        ? lines[viewsLineIndex - 2]
        : lines[1] || lines[0]
    }

    // Step 3 — YouTube search
    const cleanQuery = titleLine.split('|')[0].trim()
    const allVideos = await searchYouTube(cleanQuery, 2)
    const videos = allVideos.filter(v => {
      const t = v.title.toLowerCase()
      return !t.includes('#shorts') && !t.includes('reels') && t.length > 15
    })

    res.status(200).json({
      success: true,
      data: { extractedText, searchQuery: titleLine, videos }
    })
  } catch (error) {
    console.error('processScreenshot error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// PROCESS FULL REEL
export const processReel = async (req, res) => {
  try {
    const { caption } = req.body
    if (!caption) {
      return res.status(400).json({ success: false, message: 'No caption provided' })
    }

    // Step 1 — Extract titles with Groq
    const text = await askGroq(`
      Extract all YouTube video titles mentioned in this Instagram reel caption.
      Return ONLY a JSON array of strings, nothing else.
      Example: ["Title one", "Title two"]
      Caption: ${caption}
    `)
    const cleaned = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
    const titles = JSON.parse(cleaned)

    // Step 2 — Search YouTube for each title (max 3 concurrent to avoid rate-limiting)
    const { default: pLimit } = await import('p-limit')
    const limit = pLimit(3)

    const videoResults = await Promise.all(
      titles.map(title => limit(() => searchYouTube(title, 1).then(items => items[0] ?? null)))
    )

    const seen = new Set()
    const videos = videoResults.filter(v => {
      if (!v || seen.has(v.videoId)) return false
      seen.add(v.videoId)
      return true
    })

    res.status(200).json({ success: true, data: { videos } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// SAVE MULTIPLE VIDEOS AT ONCE
export const saveReelVideos = async (req, res) => {
  try {
    const { videos, tags } = req.body
    if (!videos || videos.length === 0) {
      return res.status(400).json({ success: false, message: 'No videos provided' })
    }
    const resources = videos.map((video) => ({
      type: 'video',
      platform: 'youtube',
      title: video.title,
      channel: video.channel,
      videoId: video.videoId,
      thumbnail: video.thumbnail,
      url: video.url,
      tags: tags || [],
      isFavorite: false,
    }))

    const incomingIds = resources.map(r => r.videoId).filter(Boolean)
    const existing = await Resource.find({ videoId: { $in: incomingIds } }).select('videoId')
    const existingIds = new Set(existing.map(r => r.videoId))
    const newResources = resources.filter(r => !existingIds.has(r.videoId))

    if (newResources.length === 0) {
      return res.status(400).json({ success: false, message: 'All videos are already saved' })
    }
    const saved = await Resource.insertMany(newResources)
    res.status(201).json({
      success: true,
      message: `${saved.length} videos saved`,
      data: saved,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// AUTO TAG
export const autoTag = async (req, res) => {
  try {
    const { title, description, body } = req.body
    if (!title) {
      return res.status(400).json({ success: false, message: 'No title provided' })
    }
    const text = await askGroq(`
      Suggest 3-5 relevant tags for this content.
      Return ONLY a JSON array of lowercase strings, nothing else.
      Example: ["coding", "react", "tutorial"]
      Title: ${title}
      ${description ? `Description: ${description}` : ''}
      ${body ? `Content: ${body}` : ''}
    `)
    const cleaned = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
    const tags = JSON.parse(cleaned)
    res.status(200).json({ success: true, data: { tags } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET ALL UNIQUE TAGS
export const getTags = async (req, res) => {
  try {
    const tags = await Resource.distinct('tags')
    // Filter out empty strings and sort alphabetically
    const cleanTags = tags.filter(t => t && t.trim() !== '').sort()
    res.status(200).json({ success: true, data: cleanTags })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// FETCH YOUTUBE VIDEO DETAILS BY URL
export const getYoutubeDetails = async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ success: false, message: 'No URL provided' })
    }

    let videoId
    try {
      const urlObj = new URL(url)
      videoId = urlObj.searchParams.get('v') ||
                urlObj.pathname.split('/').pop()
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL' })
    }

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Could not extract video ID' })
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
    )
    const data = await response.json()
    const item = data.items?.[0]

    if (!item) {
      return res.status(404).json({ success: false, message: 'Video not found' })
    }

    res.status(200).json({
      success: true,
      data: {
        videoId,
        title: decodeHtml(item.snippet.title),
        channel: decodeHtml(item.snippet.channelTitle),
        thumbnail: item.snippet.thumbnails.medium?.url,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
