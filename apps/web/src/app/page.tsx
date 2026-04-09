import { ChatInterface } from '@/modules/chat/components/chat-interface'

export default function Home() {
  return (
    <main className="grid min-h-screen px-5 py-12 md:px-8">
      <div className="flex min-h-full items-start justify-center">
        <ChatInterface />
      </div>
    </main>
  )
}
