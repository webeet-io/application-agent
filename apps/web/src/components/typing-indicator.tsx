export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-[#69bc8c] text-[10px] font-bold text-white">
        AI
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-muted px-4 py-3.5">
        <div className="flex items-center gap-1" aria-label="Assistant is typing">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
