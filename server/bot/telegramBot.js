import { Telegraf } from 'telegraf'
import Resource from '../models/Resource.js'
import User from '../models/User.js'
import Tesseract from 'tesseract.js'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Helper — find user by telegram ID
const getUser = async (telegramId) => {
  return await User.findOne({ telegramId: String(telegramId) })
}

// Helper — auto tag using Groq
const getAutoTags = async (title) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ 
        role: 'user', 
        content: `Suggest 3-5 relevant tags for: "${title}". Return ONLY a JSON array of lowercase strings. Example: ["coding","react"]` 
      }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
    })
    const text = completion.choices[0].message.content.trim()
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}

export const setupBot = (app) => {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

  // /start command
  bot.start(async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (user) {
      ctx.reply(`Welcome back ${user.name}! 🧠\n\nSend me anything to save it to your Second Brain:\n\n🔗 A URL → saved as link\n▶️ A YouTube URL → saved as video\n📸 A screenshot → OCR + YouTube search\n📝 Any text → saved as note\n\n/list — see recent saves\n/digest — this week's saves\n/search [query] — search your brain`)
    } else {
      ctx.reply(`Welcome to Second Brain Bot! 🧠\n\nTo connect your account, use:\n/connect your@email.com yourpassword`)
    }
  })

  // /connect command — links telegram to Second Brain account
  bot.command('connect', async (ctx) => {
    const parts = ctx.message.text.split(' ')
    if (parts.length < 3) {
      return ctx.reply('Usage: /connect your@email.com yourpassword')
    }
    const email = parts[1]
    const password = parts[2]

    try {
      const user = await User.findOne({ email })
      if (!user) return ctx.reply('❌ Email not found. Register at the website first.')

      const isMatch = await user.matchPassword(password)
      if (!isMatch) return ctx.reply('❌ Wrong password.')

      user.telegramId = String(ctx.from.id)
      await user.save()

      ctx.reply(`✅ Connected! Welcome ${user.name}.\n\nYour Second Brain is ready. Send me anything to save it.`)
    } catch (err) {
      ctx.reply('Something went wrong. Try again.')
    }
  })

  // /list command
  bot.command('list', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')

    const resources = await Resource.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)

    if (resources.length === 0) return ctx.reply('Nothing saved yet.')

    const list = resources.map((r, i) => {
      const title = r.title || 'Untitled'
      const type = r.type === 'video' ? '▶️' : r.type === 'link' ? '🔗' : '📝'
      return `${i + 1}. ${type} ${title}`
    }).join('\n')

    ctx.reply(`Your recent saves:\n\n${list}`)
  })

  // /digest command
  bot.command('digest', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const resources = await Resource.find({
      userId: user._id,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 })

    if (resources.length === 0) return ctx.reply('Nothing saved this week.')

    ctx.reply(`📅 This week you saved ${resources.length} resources:\n\n${
      resources.map(r => `• ${r.title || 'Untitled'}`).join('\n')
    }`)
  })

  // /search command
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
      const type = r.type === 'video' ? '▶️' : r.type === 'link' ? '🔗' : '📝'
      const url = r.url ? `\n${r.url}` : ''
      return `${type} ${r.title}${url}`
    }).join('\n\n')

    ctx.reply(`Search results for "${query}":\n\n${list}`)
  })

  // Handle text messages — save as note or detect URL
  bot.on('text', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')

    const text = ctx.message.text
    if (text.startsWith('/')) return

    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlRegex)

    if (urls) {
      const url = urls[0]
      ctx.reply('🔄 Saving...')

      try {
        // YouTube URL
        if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
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

            ctx.reply(`✅ Saved!\n\n▶️ ${title}\n🏷️ ${tags.join(', ')}`)
          } else {
            ctx.reply('❌ Could not fetch video details.')
          }
        } else {
          // Regular URL — save as link
          const title = text.replace(url, '').trim() || url
          const siteName = new URL(url).hostname
          const tags = await getAutoTags(title || siteName)

          await Resource.create({
            userId: user._id,
            type: 'link',
            title: title || siteName,
            url,
            siteName,
            tags,
          })

          ctx.reply(`✅ Saved!\n\n🔗 ${title || siteName}\n🏷️ ${tags.join(', ')}`)
        }
      } catch (err) {
        console.error('Bot URL error:', err)
        ctx.reply('❌ Failed to save. Try again.')
      }
    } else {
      // Plain text — save as note
      try {
        const tags = await getAutoTags(text.slice(0, 100))
        await Resource.create({
          userId: user._id,
          type: 'note',
          title: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
          body: text,
          tags,
        })
        ctx.reply(`✅ Note saved!\n🏷️ ${tags.join(', ')}`)
      } catch (err) {
        ctx.reply('❌ Failed to save note.')
      }
    }
  })

  // Handle photos — OCR pipeline
  bot.on('photo', async (ctx) => {
    const user = await getUser(ctx.from.id)
    if (!user) return ctx.reply('Connect first: /connect email password')

    ctx.reply('📸 Processing image... (this takes ~15 seconds)')

    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1]
      const fileLink = await ctx.telegram.getFileLink(photo.file_id)
      const imageUrl = fileLink.href

      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng')
      const extractedText = text.trim()

      const completion = await groq.chat.completions.create({
        messages: [{
          role: 'user',
          content: `Extract the YouTube video title from this OCR text. Return only the title as plain text.\n\nOCR: ${extractedText}`
        }],
        model: 'llama3-8b-8192',
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
        ctx.reply(`❌ Could not find a matching video.\n\nExtracted text:\n${extractedText.slice(0, 200)}`)
      }
    } catch (err) {
      console.error('Bot photo error:', err)
      ctx.reply('❌ Failed to process image.')
    }
  })

  // Launch bot
  bot.launch()
  console.log('🤖 Telegram bot is running')

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))

  return bot
}