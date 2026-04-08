import { ChatInterface } from '@/modules/chat/components/chat-interface'

export default function Home() {
  return (
    <main className="grid min-h-screen gap-7 px-5 py-12 md:px-8">
      <section className="mx-auto w-full max-w-7xl rounded-[2rem] border border-[rgba(71,53,40,0.11)] bg-[linear-gradient(135deg,rgba(255,252,247,0.9),rgba(247,237,226,0.82))] p-5 shadow-[0_28px_80px_rgba(65,46,32,0.16)] md:p-10">
        <div className="max-w-3xl">
          <p className="text-[0.5rem] font-bold uppercase tracking-[0.12em] text-[#6d6055]">
            Inspired by Salezee
          </p>
          <h1 className="mt-2 text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.96]">
            CeeVee conversational workspace
          </h1>
          <p className="mt-[18px] max-w-[56ch] text-[1.05rem] leading-[1.65] text-[#6d6055]">
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
