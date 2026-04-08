import { Fragment, type ReactNode } from 'react'

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const rawUrlPattern = /(https?:\/\/[^\s]+)(?![^<]*>|[^[]*\])/g

interface RenderMessageContentOptions {
  linkClassName?: string
  rawLinkClassName?: string
}

const defaultLinkClassName =
  'rounded-sm font-semibold underline decoration-2 underline-offset-[0.18em] outline-none transition-colors transition-[background-color,text-decoration-color] duration-150'

const defaultRawLinkClassName = 'break-all'

export function renderMessageContent(
  content: string,
  options: RenderMessageContentOptions = {},
): ReactNode {
  const linkClassName = options.linkClassName ?? defaultLinkClassName
  const rawLinkClassName = options.rawLinkClassName ?? defaultRawLinkClassName

  return content.split('\n').map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {renderInlineContent(line, linkClassName, rawLinkClassName)}
    </Fragment>
  ))
}

function renderInlineContent(
  line: string,
  linkClassName: string,
  rawLinkClassName: string,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of line.matchAll(markdownLinkPattern)) {
    const [fullMatch, label, url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(...renderRawUrls(line.slice(cursor, start), cursor, linkClassName, rawLinkClassName))
    }

    nodes.push(
      <a
        key={`md-${start}-${url}`}
        className={linkClassName}
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
    nodes.push(...renderRawUrls(line.slice(cursor), cursor, linkClassName, rawLinkClassName))
  }

  return nodes.length ? nodes : [line]
}

function renderRawUrls(
  text: string,
  offset: number,
  linkClassName: string,
  rawLinkClassName: string,
): ReactNode[] {
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
        className={`${linkClassName} ${rawLinkClassName}`}
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
