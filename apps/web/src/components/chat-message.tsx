import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'assistant' | 'user'
  children: React.ReactNode
}

export function ChatMessage({ role, children }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-[#69bc8c] text-[10px] font-bold text-white">
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm border border-border bg-muted text-foreground'
        )}
      >
        {children}
      </div>
    </div>
  )
}
