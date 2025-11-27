# AGENT_TIPS_PLAYWRIGHT.md - E2E Testing Guide

This document provides guidance for AI agents writing and running Playwright end-to-end tests for vibe-ltp.

## Overview

We use Playwright to test critical user flows across the application. Tests should be:
- **Realistic**: Mimic actual user behavior
- **Isolated**: Each test should be independent
- **Clear**: Test names should describe the user scenario

---

## Running E2E Tests

### Prerequisites

```bash
# Install dependencies (includes Playwright browsers)
pnpm install

# Install Playwright browsers if needed
pnpm exec playwright install
```

### Run Tests

```bash
# Run all e2e tests
pnpm e2e

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test tests/puzzle-flow.spec.ts

# Debug mode
pnpm exec playwright test --debug
```

---

## Test Structure

### Location
- Tests go in: `apps/web/tests/e2e/`
- Follow naming: `*.spec.ts`

### Example Test

```ts
import { test, expect } from '@playwright/test';

test.describe('Puzzle browsing flow', () => {
  test('user can browse and select a puzzle', async ({ page }) => {
    // Navigate to home
    await page.goto('http://localhost:3000');
    
    // Click "Browse Puzzles"
    await page.click('text=Browse Puzzles');
    
    // Should see puzzle list
    await expect(page).toHaveURL('/puzzles');
    await expect(page.locator('h1')).toContainText('Browse Puzzles');
    
    // Click on first puzzle
    await page.click('[data-testid="puzzle-card"]:first-child');
    
    // Should navigate to puzzle detail
    await expect(page).toHaveURL(/\/puzzles\/.+/);
  });
});
```

---

## Key Test Scenarios

### 1. Puzzle Discovery Flow
**Goal**: User finds and views a puzzle

```ts
test('user discovers a puzzle', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Browse Puzzles');
  
  // Filter by tag
  await page.click('text=classic');
  
  // View puzzle detail
  await page.click('[data-testid="puzzle-card"]:first-child');
  
  // See surface but not bottom
  await expect(page.locator('[data-testid="soup-surface"]')).toBeVisible();
  await expect(page.locator('[data-testid="soup-bottom"]')).not.toBeVisible();
});
```

### 2. Room Creation & Join
**Goal**: Host creates room, player joins

```ts
test('host creates room and player joins', async ({ browser }) => {
  // Create two browser contexts (host and player)
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  
  const hostPage = await hostContext.newPage();
  const playerPage = await playerContext.newPage();
  
  // Host creates room
  await hostPage.goto('/puzzles/some-puzzle-id');
  await hostPage.click('text=Create Room');
  
  const roomUrl = hostPage.url();
  const roomId = roomUrl.split('/').pop();
  
  // Player joins room
  await playerPage.goto(roomUrl);
  
  // Both see each other
  await expect(hostPage.locator('[data-testid="participant-list"]'))
    .toContainText('Host');
  await expect(playerPage.locator('[data-testid="participant-list"]'))
    .toContainText('Player');
  
  await hostContext.close();
  await playerContext.close();
});
```

### 3. Question & Answer Flow
**Goal**: Player asks question, host answers

```ts
test('question and answer flow', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  
  const hostPage = await hostContext.newPage();
  const playerPage = await playerContext.newPage();
  
  // Setup room (host creates, player joins)
  // ... (room creation code)
  
  // Host starts session
  await hostPage.click('text=Start Session');
  
  // Player asks question
  await playerPage.fill('[data-testid="question-input"]', 'Was it an accident?');
  await playerPage.click('[data-testid="ask-question-btn"]');
  
  // Host sees question
  await expect(hostPage.locator('[data-testid="question-list"]'))
    .toContainText('Was it an accident?');
  
  // Host answers
  await hostPage.click('[data-testid="answer-no-btn"]');
  await hostPage.fill('[data-testid="explanation-input"]', 'It was intentional');
  await hostPage.click('[data-testid="submit-answer-btn"]');
  
  // Player sees answer
  await expect(playerPage.locator('[data-testid="question-list"]'))
    .toContainText('No: It was intentional');
  
  await hostContext.close();
  await playerContext.close();
});
```

### 4. Solution Reveal
**Goal**: Host reveals solution, all see it

```ts
test('host reveals solution', async ({ browser }) => {
  // ... setup room with host and player
  
  // Host reveals solution
  await hostPage.click('text=Reveal Solution');
  await hostPage.click('text=Confirm');
  
  // Both see solution
  await expect(hostPage.locator('[data-testid="soup-bottom"]')).toBeVisible();
  await expect(playerPage.locator('[data-testid="soup-bottom"]')).toBeVisible();
  
  // Room marked as solved
  await expect(hostPage.locator('[data-testid="room-status"]'))
    .toContainText('SOLVED');
});
```

---

## Best Practices

### 1. Use Data Test IDs

Add `data-testid` attributes to key elements:

```tsx
// In React component
<button data-testid="ask-question-btn" onClick={handleAsk}>
  Ask Question
</button>

// In test
await page.click('[data-testid="ask-question-btn"]');
```

### 2. Wait for Network Requests

```ts
// Wait for API call to complete
await page.waitForResponse((response) => 
  response.url().includes('/api/rooms') && response.status() === 200
);
```

### 3. Use Fixtures for Common Setup

```ts
// fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Auto-login logic
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('text=Login');
    await page.waitForURL('/');
    
    await use(page);
  },
});
```

### 4. Test Real-Time Behavior

```ts
test('real-time updates via socket', async ({ browser }) => {
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  
  await page1.goto('/room/123');
  await page2.goto('/room/123');
  
  // Action on page1
  await page1.click('[data-testid="send-msg-btn"]');
  
  // Check update on page2
  await expect(page2.locator('[data-testid="messages"]'))
    .toContainText('New message', { timeout: 5000 });
});
```

---

## Debugging Failed Tests

### 1. Screenshots on Failure

Playwright auto-captures screenshots. Find them in:
```
test-results/
```

### 2. Trace Viewer

```bash
# Run with trace
pnpm exec playwright test --trace on

# Open trace viewer
pnpm exec playwright show-trace trace.zip
```

### 3. Debug Mode

```bash
pnpm exec playwright test --debug
```

This opens:
- Inspector to step through
- Browser to see actions

---

## Configuration

### Playwright Config

Located at: `playwright.config.ts`

Key settings:
```ts
export default defineConfig({
  testDir: './apps/web/tests/e2e',
  timeout: 30000,
  retries: 2,
  workers: 4,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

---

## Writing New Tests - Checklist

Before writing a test:
1. ✅ Identify the user flow
2. ✅ List expected outcomes
3. ✅ Add `data-testid` to relevant UI elements
4. ✅ Write the test
5. ✅ Run locally to verify
6. ✅ Check it passes in CI

---

## Common Issues

### Port Conflicts
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Stale Test Data
```bash
# Reset test database
cd apps/server
pnpm prisma migrate reset --force
```

### Flaky Tests
- Add explicit waits: `page.waitForSelector()`
- Use `waitForLoadState('networkidle')`
- Increase timeout for slow operations

---

## Additional Resources

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
