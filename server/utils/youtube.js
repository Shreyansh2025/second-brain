import { decodeHtml } from './decodeHtml.js'

export const searchYouTube = async (query, maxResults = 5) => {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY)

  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  return (data.items ?? []).map(item => ({
    videoId: item.id.videoId,
    title: decodeHtml(item.snippet.title),
    channel: decodeHtml(item.snippet.channelTitle),
    thumbnail: item.snippet.thumbnails.medium.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }))
}
