import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Vibe LTP
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Lateral Thinking Puzzles - Solve mysteries with friends
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/puzzles"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Puzzles
            </Link>
            <Link
              href="/rooms"
              className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Join Room
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">🧩 Mystery Puzzles</h3>
            <p className="text-gray-600">
              Solve intriguing lateral thinking puzzles with cryptic scenarios
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">👥 Multiplayer Rooms</h3>
            <p className="text-gray-600">
              Create or join rooms to solve puzzles with friends in real-time
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">💡 Q&A System</h3>
            <p className="text-gray-600">
              Ask yes/no questions to uncover the truth behind each mystery
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
