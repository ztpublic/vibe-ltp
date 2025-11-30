import { test, expect } from '@playwright/test';

test.describe('Chatbot Puzzle Flow', () => {
  test('should create puzzle, validate UI updates, reveal truth, and validate UI', async ({ page }) => {
    // 1. Open the main chatbot page
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: '汤面' })).toBeVisible();
    
    // Verify initial state - "开始新汤" button should be enabled
    const startButton = page.getByRole('button', { name: '开始新汤' });
    await expect(startButton).toBeEnabled();
    
    // Verify "公布答案" button should be disabled initially
    const revealButton = page.getByRole('button', { name: '公布答案' });
    await expect(revealButton).toBeDisabled();
    
    // Verify initial puzzle surface text
    await expect(page.getByText('等待开始新汤...')).toBeVisible();
    
    // 2. Create a new puzzle
    await startButton.click();
    
    // Wait for dialog to appear
    await expect(page.getByRole('heading', { name: '输入谜题内容' })).toBeVisible();
    
    // Fill in the puzzle surface
    const surfaceTextarea = page.getByPlaceholder('输入谜题的表面描述...');
    await surfaceTextarea.fill('一个男人走进酒吧，点了一杯水。酒保突然拿出一把枪指着他。男人说了声谢谢就离开了。为什么？');
    
    // Fill in the puzzle truth
    const truthTextarea = page.getByPlaceholder('输入谜题的真相答案...');
    await truthTextarea.fill('这个男人患有打嗝症，他走进酒吧想喝水来缓解打嗝。酒保意识到了这一点，决定用惊吓的方式帮他止住打嗝，所以拔出了枪。男人被吓到后打嗝停止了，所以感谢酒保并离开了。');
    
    // Click confirm button
    const confirmButton = page.getByRole('button', { name: '确定' });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    
    // 3. Validate UI updates after creating puzzle
    // Wait for dialog to close
    await expect(page.getByRole('heading', { name: '输入谜题内容' })).not.toBeVisible();
    
    // Verify puzzle surface is now displayed
    await expect(page.getByText('一个男人走进酒吧，点了一杯水。酒保突然拿出一把枪指着他。男人说了声谢谢就离开了。为什么？')).toBeVisible();
    
    // Verify "等待开始新汤..." is no longer shown
    await expect(page.getByText('等待开始新汤...')).not.toBeVisible();
    
    // Verify "开始新汤" button is now disabled
    await expect(startButton).toBeDisabled();
    
    // Verify "公布答案" button is now enabled
    await expect(revealButton).toBeEnabled();
    
    // Verify chatbot is enabled (check that input is not disabled)
    const chatInput = page.getByPlaceholder('向主持人提问');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).not.toBeDisabled();
    
    // 4. Click "reveal truth" button
    await revealButton.click();
    
    // 5. Validate UI updates after revealing truth
    // Wait for truth message to appear in chatbot
    await expect(page.getByText(/💡 谜题真相：/)).toBeVisible();
    await expect(page.getByText(/这个男人患有打嗝症/)).toBeVisible();
    
    // Verify game state is reset - "开始新汤" should be enabled again
    await expect(startButton).toBeEnabled();
    
    // Verify "公布答案" button is disabled again
    await expect(revealButton).toBeDisabled();
    
    // Verify puzzle surface is reset to initial state
    await expect(page.getByText('等待开始新汤...')).toBeVisible();
    
    // 6. End test (test cleanup happens automatically)
  });
  
  test('should not allow creating puzzle with empty fields', async ({ page }) => {
    await page.goto('/');
    
    // Click start button to open dialog
    await page.getByRole('button', { name: '开始新汤' }).click();
    
    // Wait for dialog
    await expect(page.getByRole('heading', { name: '输入谜题内容' })).toBeVisible();
    
    // Confirm button should be disabled when fields are empty
    const confirmButton = page.getByRole('button', { name: '确定' });
    await expect(confirmButton).toBeDisabled();
    
    // Fill only surface, confirm should still be disabled
    await page.getByPlaceholder('输入谜题的表面描述...').fill('Test surface');
    await expect(confirmButton).toBeDisabled();
    
    // Clear surface and fill only truth, confirm should still be disabled
    await page.getByPlaceholder('输入谜题的表面描述...').clear();
    await page.getByPlaceholder('输入谜题的真相答案...').fill('Test truth');
    await expect(confirmButton).toBeDisabled();
    
    // Fill both fields, confirm should be enabled
    await page.getByPlaceholder('输入谜题的表面描述...').fill('Test surface');
    await expect(confirmButton).toBeEnabled();
    
    // Cancel the dialog
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: '输入谜题内容' })).not.toBeVisible();
  });
});
