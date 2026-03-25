import { ChatInterface } from '@/modules/chat/components/chat-interface'

export default function Home() {
  return (
    <main className="app-frame">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="hero-panel__eyebrow">Inspired by Salezee</p>
          <h1>CeeVee conversational workspace</h1>
          <p className="hero-panel__text">
            This module isolates the chat experience into a dedicated frontend surface.
            The user writes messages, the LLM responds as the second conversation partner,
            and the UI keeps the dialogue focused on one clear thread.
          </p>
        </div>
      </section>

      <ChatInterface />
    </main>
  )
}
