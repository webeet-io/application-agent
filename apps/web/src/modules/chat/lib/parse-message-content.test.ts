import { describe, expect, it } from 'vitest'
import { parseMessageContent } from './parse-message-content'

describe('parseMessageContent', () => {
  it('parses markdown links into link segments', () => {
    expect(parseMessageContent('See [OpenAI](https://openai.com/docs) for details.')).toEqual([
      [
        { type: 'text', text: 'See ' },
        {
          type: 'link',
          href: 'https://openai.com/docs',
          label: 'OpenAI',
          raw: false,
        },
        { type: 'text', text: ' for details.' },
      ],
    ])
  })

  it('parses raw URLs and keeps trailing punctuation outside the link', () => {
    expect(parseMessageContent('Read https://example.com/report).')).toEqual([
      [
        { type: 'text', text: 'Read ' },
        {
          type: 'link',
          href: 'https://example.com/report',
          label: 'https://example.com/report',
          raw: true,
        },
        { type: 'text', text: ').' },
      ],
    ])
  })

  it('preserves line boundaries', () => {
    expect(parseMessageContent('Line one\nLine two')).toEqual([
      [{ type: 'text', text: 'Line one' }],
      [{ type: 'text', text: 'Line two' }],
    ])
  })
})
