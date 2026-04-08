const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const rawUrlPattern = /(https?:\/\/[^\s]+)(?![^<]*>|[^[]*\])/g

export type MessageContentSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; href: string; label: string; raw: boolean }

export function parseMessageLine(line: string): MessageContentSegment[] {
  const segments: MessageContentSegment[] = []
  let cursor = 0

  for (const match of line.matchAll(markdownLinkPattern)) {
    const [fullMatch, label, url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      segments.push(...parseRawUrlSegments(line.slice(cursor, start)))
    }

    segments.push({
      type: 'link',
      href: url,
      label,
      raw: false,
    })

    cursor = start + fullMatch.length
  }

  if (cursor < line.length) {
    segments.push(...parseRawUrlSegments(line.slice(cursor)))
  }

  return segments.length ? segments : [{ type: 'text', text: line }]
}

export function parseMessageContent(content: string): MessageContentSegment[][] {
  return content.split('\n').map(parseMessageLine)
}

function parseRawUrlSegments(text: string): MessageContentSegment[] {
  const segments: MessageContentSegment[] = []
  let cursor = 0

  for (const match of text.matchAll(rawUrlPattern)) {
    const [url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, start) })
    }

    const trimmedUrl = url.replace(/[),.;!?]+$/, '')
    const trailing = url.slice(trimmedUrl.length)

    segments.push({
      type: 'link',
      href: trimmedUrl,
      label: trimmedUrl,
      raw: true,
    })

    if (trailing) {
      segments.push({ type: 'text', text: trailing })
    }

    cursor = start + url.length
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) })
  }

  return segments.length ? segments : [{ type: 'text', text }]
}
