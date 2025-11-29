/**
 * Test script for puzzle agent workflow
 * Tests a sample puzzle truth with a question
 * 
 * Usage: 
 *   node test-puzzle-agent.mjs
 * 
 * This script:
 * - Loads environment variables from .env (OPENROUTER_API_KEY, LLM_MODEL_ID)
 * - Tests the puzzle agent with a sample puzzle and question
 * - Prints the evaluation result and formatted UI reply
 * 
 * You can modify the testPuzzle and testQuestion variables below to test different scenarios.
 */

// Environment variables are loaded by the server's index.ts pattern
// We'll use the same approach here
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Simple .env parser (avoid external dependency)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.error('Warning: Could not load .env file:', error.message);
}

console.log('🔧 Environment Configuration:');
console.log('─'.repeat(60));
console.log('📁 .env path:', envPath);
console.log('🔑 OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✓ Present' : '✗ Missing');
console.log('🤖 LLM_MODEL_ID:', process.env.LLM_MODEL_ID || 'x-ai/grok-4.1-fast:free (default)');
console.log('─'.repeat(60));
console.log();

// Import after env is loaded
import { evaluatePuzzleQuestion, formatEvaluationReply } from './packages/llm-client/dist/index.js';

// Sample puzzle from classic.json
const testPuzzle = {
  soupSurface: "A woman pushes her car to a hotel and realizes she's bankrupt.",
  soupTruth: "She's playing Monopoly.",
};

// Test question
const testQuestion = "Did she actually travel to a real hotel?";

async function runTest() {
  console.log('🧩 Puzzle Agent Test');
  console.log('═'.repeat(60));
  console.log('📝 Puzzle Surface (汤面):');
  console.log('   ', testPuzzle.soupSurface);
  console.log();
  console.log('🔍 Puzzle Truth (汤底):');
  console.log('   ', testPuzzle.soupTruth);
  console.log('═'.repeat(60));
  console.log();
  
  console.log('❓ Test Question:');
  console.log('   "' + testQuestion + '"');
  console.log();
  console.log('⏳ Evaluating with LLM agent...');
  console.log();

  try {
    const model = process.env.LLM_MODEL_ID || 'x-ai/grok-4.1-fast:free';
    
    const result = await evaluatePuzzleQuestion(
      testQuestion,
      {
        surface: testPuzzle.soupSurface,
        truth: testPuzzle.soupTruth,
      },
      model
    );

    console.log('\n✅ Agent Evaluation Result:');
    console.log('═'.repeat(60));
    console.log('📊 Answer:', result.answer.toUpperCase());
    if (result.tips) {
      console.log('💡 Tips:', result.tips);
    }
    console.log('═'.repeat(60));
    
    console.log();
    console.log('💬 Formatted Chat UI Reply:');
    console.log('─'.repeat(60));
    const formattedReply = formatEvaluationReply(result);
    console.log(formattedReply);
    console.log('─'.repeat(60));
    
    console.log();
    console.log('✅ Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error('─'.repeat(60));
    if (error instanceof Error) {
      console.error('Message:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    console.error('─'.repeat(60));
    process.exit(1);
  }
}

// Run the test
runTest();
