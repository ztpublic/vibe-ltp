import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { embedTexts, findMostSimilarEmbedding } from '@vibe-ltp/llm-client';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Embeddings demo (qwen/qwen3-embedding-8b)');

  const corpus = [
    'A detective investigates a mysterious locked room.',
    'A chef is preparing a seven-course dinner.',
    'An astronaut conducts a spacewalk outside the station.',
    'A swimmer crosses a cold lake at dawn.',
    'Two friends start a road trip across the desert.',
  ];

  const query = process.argv[2] ?? 'mysterious investigator';

  console.log('\nGenerating embeddings for corpus...');
  const embeddings = await embedTexts(corpus);
  console.log(`Generated ${embeddings.length} embeddings.`);

  console.log(`\nQuerying with: "${query}"`);
  const { similarity, index } = await findMostSimilarEmbedding(query, embeddings);

  console.log(`Most similar index: ${index}`);
  console.log(`Similarity score: ${similarity.toFixed(4)}`);
  console.log(`Matched text: "${corpus[index]}"`);
}

main().catch(error => {
  console.error('Embeddings demo failed:', error);
  process.exit(1);
});
