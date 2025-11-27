export default function PuzzleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Puzzle {params.id}</h1>
        <p className="text-gray-600">Puzzle details coming soon...</p>
      </div>
    </div>
  );
}
