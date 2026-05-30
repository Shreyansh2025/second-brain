import { Telegraf } from 'telegraf'
import Resource from '../models/Resource.js'
import User from '../models/User.js'
import Tesseract from 'tesseract.js'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const getUser = async (telegramId) => {
  return await User.findOne({ telegramId: String(telegramId) })
}

const getAutoTags = async (title) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Suggest 3-5 relevant tags for: "${title}". Return ONLY a JSON array of lowercase strings. Example: ["coding","react"]`
      }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    })
    const text = completion.choices[0].message.content.trim()
    const cleaned = text.replace(/```json|```/g, '').trim()
    
    // Find JSON array anywhere in the response
    const match = cleaned.match(/\[.*?\]/s)
    if (!match) return []
    
    return JSON.parse(match[0])
  } catch (err) {
    console.error('getAutoTags error:', err.message)
    return []
  }
}

export const setupBot = () => {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

  bot.start(async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (user) {
      ctx.reply(`Welcome back ${user.name}! 🧠\n\nSend me anything to save it:\n\n🔗 URL → link\n▶️ YouTube URL → video\n📸 Screenshot → OCR pipeline\n📝 Text → note\n\n/list — recent saves\n/digest — this week\n/search [query] — search`)
    } else {
      ctx.reply(`Welcome to Second Brain Bot! 🧠\n\nConnect your account:\n/connect your@email.com yourpassword`)
    }
  })

  bot.command('connect', async (ctx) => {
    const parts = ctx.message.text.split(' ')
    if (parts.length < 3) return ctx.reply('Usage: /connect your@email.com yourpassword')
    const [, email, password] = parts
    try {
      const user = await User.findOne({ email })
      if (!user) return ctx.reply('❌ Email not found. Register on the website first.')
      const isMatch = await user.matchPassword(password)
      if (!isMatch) return ctx.reply('❌ Wrong password.')
      user.telegramId = String(ctx.from.id)
      await user.save()
      ctx.reply(`✅ Connected! Welcome ${user.name}. Your Second Brain is ready.`)
    } catch (err) {
      ctx.reply('Something went wrong. Try again.')
    }
  })

  bot.command('list', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')
    const resources = await Resource.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5)
    if (resources.length === 0) return ctx.reply('Nothing saved yet.')
    const list = resources.map((r, i) => {
      const icon = r.type === 'video' ? '▶️' : r.type === 'link' ? '🔗' : '📝'
      return `${i + 1}. ${icon} ${r.title || 'Untitled'}`
    }).join('\n')
    ctx.reply(`Your recent saves:\n\n${list}`)
  })

  bot.command('digest', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const resources = await Resource.find({ userId: user._id, createdAt: { $gte: sevenDaysAgo } }).sort({ createdAt: -1 })
    if (resources.length === 0) return ctx.reply('Nothing saved this week.')
    ctx.reply(`📅 This week: ${resources.length} resources\n\n${resources.map(r => `• ${r.title || 'Untitled'}`).join('\n')}`)
  })

  bot.command('search', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')
    const query = ctx.message.text.replace('/search', '').trim()
    if (!query) return ctx.reply('Usage: /search discipline')
    const regex = { $regex: query, $options: 'i' }
    const resources = await Resource.find({
      userId: user._id,
      $or: [{ title: regex }, { tags: regex }, { body: regex }, { extractedText: regex }]
    }).limit(5)
    if (resources.length === 0) return ctx.reply(`No results for "${query}"`)
    const list = resources.map(r => {
      const icon = r.type === 'video' ? '▶️' : r.type === 'link' ? '🔗' : '📝'
      return `${icon} ${r.title}${r.url ? '\n' + r.url : ''}`
    }).join('\n\n')
    ctx.reply(`Results for "${query}":\n\n${list}`)
  })

  bot.on('text', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')
    const text = ctx.message.text
    if (text.startsWith('/')) return

    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlRegex)

    if (urls) {
      const url = urls[0]
      await ctx.reply('🔄 Saving...')
      try {
        if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
          // YouTube
          const videoId = url.includes('youtu.be')
            ? url.split('youtu.be/')[1]?.split('?')[0]
            : new URL(url).searchParams.get('v')

          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
          )
          const data = await response.json()
          const item = data.items?.[0]

          if (item) {
            const title = item.snippet.title
            const tags = await getAutoTags(title)
            await Resource.create({
              userId: user._id,
              type: 'video',
              platform: 'youtube',
              title,
              channel: item.snippet.channelTitle,
              videoId,
              thumbnail: item.snippet.thumbnails.medium?.url,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              tags,
            })
            ctx.reply(`✅ Saved!\n\n▶️ ${title}\n🏷️ ${tags.length > 0 ? tags.join(', ') : 'no tags'}`)
          } else {
            ctx.reply('❌ Could not fetch video details.')
          }
        } else {
          // Regular link — auto fetch page title
          let title = text.replace(url, '').trim()
          if (!title) {
            try {
              const pageRes = await fetch(url, { signal: AbortSignal.timeout(5000) })
              const html = await pageRes.text()
              const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
              title = match ? match[1].trim() : new URL(url).hostname
            } catch {
              title = new URL(url).hostname
            }
          }
          const siteName = new URL(url).hostname
          const tags = await getAutoTags(title)
          await Resource.create({
            userId: user._id,
            type: 'link',
            title,
            url,
            siteName,
            tags,
          })
          ctx.reply(`✅ Saved!\n\n🔗 ${title}\n🏷️ ${tags.length > 0 ? tags.join(', ') : 'no tags'}`)
        }
      } catch (err) {
        console.error('Bot URL error:', err)
        ctx.reply('❌ Failed to save. Try again.')
      }
    } else {
      // Plain text → note
      try {
        const tags = await getAutoTags(text.slice(0, 100))
        await Resource.create({
          userId: user._id,
          type: 'note',
          title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
          body: text,
          tags,
        })
        ctx.reply(`✅ Note saved!\n🏷️ ${tags.length > 0 ? tags.join(', ') : 'no tags'}`)
      } catch (err) {
        ctx.reply('❌ Failed to save note.')
      }
    }
  })

  bot.on('photo', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')
    await ctx.reply('📸 Processing... (~15 seconds)')
    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1]
      const fileLink = await ctx.telegram.getFileLink(photo.file_id)
      const { data: { text } } = await Tesseract.recognize(fileLink.href, 'eng')
      const extractedText = text.trim()

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: `Extract the YouTube video title from this OCR text. Return only the title.\n\nOCR: ${extractedText}` }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
      })
      const titleLine = completion.choices[0].message.content.trim()

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(titleLine)}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`
      )
      const data = await response.json()
      const item = data.items?.[0]

      if (item) {
        const title = item.snippet.title
        const videoId = item.id.videoId
        const tags = await getAutoTags(title)
        await Resource.create({
          userId: user._id,
          type: 'video',
          platform: 'youtube',
          title,
          channel: item.snippet.channelTitle,
          videoId,
          thumbnail: item.snippet.thumbnails.medium?.url,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          extractedText,
          tags,
        })
        ctx.reply(`✅ Found and saved!\n\n▶️ ${title}\n🔗 https://youtube.com/watch?v=${videoId}\n🏷️ ${tags.join(', ')}`)
      } else {
        ctx.reply(`❌ No video found.\n\nExtracted text:\n${extractedText.slice(0, 200)}`)
      }
    } catch (err) {
      console.error('Bot photo error:', err)
      ctx.reply('❌ Failed to process image.')
    }
  })

  bot.launch()
  console.log('🤖 Telegram bot is running')
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
  return bot
}