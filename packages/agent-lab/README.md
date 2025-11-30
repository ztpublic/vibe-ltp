# Agent Lab (experiments only)

Purpose-built workspace package for experimenting with the question validator agent. Use it to try different models, prompt tweaks, and datasets without touching the production server or frontend.

## Running the sample suite

```bash
# From repo root (requires OPENROUTER_API_KEY)
pnpm agent-lab:demo
```

This runs `packages/agent-lab/src/demo.ts`, exercising the question validator agent against a small set of sample cases with two agent variants (default prompt vs. cautious prompt).

## Key files

- `src/types.ts` — shared types for agent variants, experiment cases, and results
- `src/runner.ts` — core runner to execute variants across datasets and print summaries
- `src/fixtures/sampleAgents.ts` — example agent variants (model + optional system prompt override)
- `src/fixtures/cases/*.json` — example puzzle cases as plain JSON arrays (conversation history omitted)
- `src/fixtures/loadCases.ts` — loader that reads all JSON fixtures in `fixtures/cases` and normalizes context
- `src/demo.ts` — minimal entrypoint that wires fixtures into the runner

## Adding your own experiments

1) Define agents in `fixtures/` (or elsewhere) with `model`, optional `fallbackModel`, and optional `systemPrompt` if you want to tweak the base question validator prompt.  
2) Add experiment cases by dropping `.json` files into `src/fixtures/cases/` (each file is a single JSON array with `id`, `question`, `expectedAnswer?`, and `context { surface, truth }`; `conversationHistory` is not needed and is defaulted to `[]`).  
3) Call `runQuestionValidatorSuite({ agents, cases })` from a script (you can mirror `demo.ts`) and use `logSuiteResult` for quick reporting.  
4) Keep this module isolated from production code; it is meant purely for LLM experimentation.
