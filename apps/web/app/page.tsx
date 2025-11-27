'use client';

import { SoupBotChat } from '@/src/features/chatbot';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Vibe LTP</h1>
          <p className="text-sm text-gray-600">Lateral Thinking Puzzle Game</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        <SoupBotChat />
      </main>
    </div>
  );
}
