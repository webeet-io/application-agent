import { Fragment, type ReactNode } from 'react'
import { parseMessageContent } from './parse-message-content'

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

  return parseMessageContent(content).map((segments, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {renderInlineContent(segments, lineIndex, linkClassName, rawLinkClassName)}
    </Fragment>
  ))
}

function renderInlineContent(
  segments: ReturnType<typeof parseMessageContent>[number],
  lineIndex: number,
  linkClassName: string,
  rawLinkClassName: string,
): ReactNode[] {
  return segments.map((segment, index) => {
    if (segment.type === 'text') {
      return segment.text
    }

    return (
      <a
        key={`line-${lineIndex}-segment-${index}-${segment.href}`}
        className={segment.raw ? `${linkClassName} ${rawLinkClassName}` : linkClassName}
        href={segment.href}
        target="_blank"
        rel="noreferrer"
      >
        {segment.label}
      </a>
    )
  })
}
