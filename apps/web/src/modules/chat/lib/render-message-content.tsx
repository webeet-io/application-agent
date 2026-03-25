import { Fragment, type ReactNode } from 'react'

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const rawUrlPattern = /(https?:\/\/[^\s]+)(?![^<]*>|[^[]*\])/g

export function renderMessageContent(content: string): ReactNode {
  return content.split('\n').map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {renderInlineContent(line)}
    </Fragment>
  ))
}

function renderInlineContent(line: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of line.matchAll(markdownLinkPattern)) {
    const [fullMatch, label, url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(...renderRawUrls(line.slice(cursor, start), cursor))
    }

    nodes.push(
      <a
        key={`md-${start}-${url}`}
        className="chat-link"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {label}
      </a>,
    )

    cursor = start + fullMatch.length
  }

  if (cursor < line.length) {
    nodes.push(...renderRawUrls(line.slice(cursor), cursor))
  }

  return nodes.length ? nodes : [line]
}

function renderRawUrls(text: string, offset: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(rawUrlPattern)) {
    const [url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }

    const trimmedUrl = url.replace(/[),.;!?]+$/, '')
    const trailing = url.slice(trimmedUrl.length)

    nodes.push(
      <a
        key={`url-${offset + start}-${trimmedUrl}`}
        className="chat-link chat-link--raw"
        href={trimmedUrl}
        target="_blank"
        rel="noreferrer"
      >
        {trimmedUrl}
      </a>,
    )

    if (trailing) {
      nodes.push(trailing)
    }

    cursor = start + url.length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes.length ? nodes : [text]
}
