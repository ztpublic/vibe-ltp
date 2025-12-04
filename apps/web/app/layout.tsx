import type { Metadata } from 'next';
import '../src/ui/chatbot/main.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibe LTP - Lateral Thinking Puzzles',
  description: 'Solve lateral thinking puzzles with friends',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
