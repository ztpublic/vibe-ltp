# Agent Lab (experiments only)

Purpose-built workspace package for experimenting with the question validator agent and the connection distiller agent. Use it to try different models, prompt tweaks, and datasets without touching the production server or frontend.

## Running the sample suite

```bash
# From repo root (requires OPENROUTER_API_KEY)
pnpm agent-lab:demo
```

This runs `packages/agent-lab/src/demo.ts`, exercising the question validator agent against a small set of sample cases with two agent variants (default prompt vs. cautious prompt).

```bash
# From repo root (requires OPENROUTER_API_KEY)
pnpm agent-lab:demo:connections
```

This runs `packages/agent-lab/src/connectionDemo.ts`, exercising the connection distiller agent against sample puzzles pulled from the sea turtle soups dataset.

## Key files

- `src/types.ts` — shared types for agent variants, experiment cases, and results
- `src/runner.ts` — core runner to execute variants across datasets and print summaries
- `src/connectionRunner.ts` — runner for the connection distiller agent
- `src/fixtures/sampleAgents.ts` — example agent variants (model + optional system prompt override)
- `src/fixtures/cases/*.json` — example puzzle cases as plain JSON arrays (conversation history omitted)
- `src/fixtures/connectionCases.json` — sea turtle soup puzzles for connection distillation
- `src/fixtures/loadCases.ts` — loader that reads all JSON fixtures in `fixtures/cases` and normalizes context
- `src/fixtures/loadConnections.ts` — loader for connection distiller fixtures
- `src/demo.ts` — minimal entrypoint that wires fixtures into the runner
- `src/connectionDemo.ts` — entrypoint for the connection distiller agent

## Adding your own experiments

1) Define agents in `fixtures/` (or elsewhere) with `model`, optional `fallbackModel`, and optional `systemPrompt` if you want to tweak the base question validator prompt.  
2) Add experiment cases by dropping `.json` files into `src/fixtures/cases/` (each file is a single JSON array with `id`, `question`, `expectedAnswer?`, and `context { surface, truth }`; `conversationHistory` is not needed and is defaulted to `[]`).  
3) Add connection distiller puzzles by editing `src/fixtures/connectionCases.json` (each item has `id`, `context { surface, truth }`, and optional `notes`).  
4) Call `runQuestionValidatorSuite({ agents, cases })` from a script (you can mirror `demo.ts`) and use `logSuiteResult` for quick reporting.  
5) Call `runConnectionDistillerSuite({ model, cases })` from a script (mirror `connectionDemo.ts`) and use `logConnectionResults` to see distilled connections.  
6) Keep this module isolated from production code; it is meant purely for LLM experimentation.
