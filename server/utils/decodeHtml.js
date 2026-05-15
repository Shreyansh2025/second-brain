const HTML_ENTITIES = {
  '&amp;': '&',
  '&#39;': "'",
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
}

export const decodeHtml = (str = '') =>
  str.replace(/&amp;|&#39;|&quot;|&lt;|&gt;/g, match => HTML_ENTITIES[match] ?? match)
