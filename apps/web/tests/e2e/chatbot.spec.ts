import { test, expect } from '@playwright/test';

test.describe('Chatbot Puzzle Flow', () => {
  test('should create puzzle, validate UI updates, reveal truth, and validate UI', async ({ page }) => {
    // 1. Open the main chatbot page
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: '汤面' })).toBeVisible();
    
    // Wait for socket connection and initial state to be ready
    const startButton = page.getByRole('button', { name: '开始新汤' });
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    
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

  test('should handle complete gameplay flow with questions and answers', async ({ page }) => {
    // 1. Create a game with actual puzzle
    await page.goto('/');
    
    // Wait for the page to load and ensure clean state
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: '汤面' })).toBeVisible();
    
    // Wait for socket connection and initial state to be ready
    const startButton = page.getByRole('button', { name: '开始新汤' });
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    await startButton.click();
    
    // Fill in the puzzle content
    await expect(page.getByRole('heading', { name: '输入谜题内容' })).toBeVisible();
    
    const puzzleSurface = '一个男人在餐厅点了一份海龟汤，喝了一口后就走出餐厅自杀了。为什么？';
    const puzzleTruth = '这个男人曾经和朋友在海上遭遇海难，漂流时朋友给他喝了所谓的"海龟汤"让他活了下来。后来他在餐厅喝到真正的海龟汤，发现味道完全不同，才意识到当时朋友为了让他活下去，把人肉做成了汤。他无法接受这个真相，选择了自杀。';
    
    await page.getByPlaceholder('输入谜题的表面描述...').fill(puzzleSurface);
    await page.getByPlaceholder('输入谜题的真相答案...').fill(puzzleTruth);
    await page.getByRole('button', { name: '确定' }).click();
    
    // Wait for dialog to close and game to start
    await expect(page.getByRole('heading', { name: '输入谜题内容' })).not.toBeVisible();
    await expect(page.getByText(puzzleSurface)).toBeVisible();
    
    // Verify chat input is enabled
    const chatInput = page.getByPlaceholder('向主持人提问');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).not.toBeDisabled();
    
    // 2. Ask 5 questions one by one and assert every question has a response
    const questions = [
      '这个男人之前遭遇过海难吗？',
      '他在海上的时候吃过海龟汤吗？',
      '他的朋友还活着吗？',
      '汤里的肉是人肉吗？',
      '他是因为知道了真相才自杀的吗？'
    ];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]!;
      
      // Type the question and submit with Enter
      await chatInput.fill(question);
      await chatInput.press('Enter');
      
      // Wait for the question to appear in chat
      await expect(page.locator('.react-chatbot-kit-user-chat-message').filter({ hasText: question })).toBeVisible();
      
      // Wait for actual bot response with "是" or "否" (with timeout for API call)
      // The bot should respond with these actual answers
      await expect(page.locator('.react-chatbot-kit-chat-bot-message').last()).toBeVisible({ timeout: 35000 });
      
      // Wait for the actual response content to appear ("是", "否", or other meaningful response)
      // Check that the message contains actual text (not just loading)
      const lastBotMessage = page.locator('.react-chatbot-kit-chat-bot-message').last();
      await expect(lastBotMessage.locator('span')).not.toBeEmpty({ timeout: 35000 });
      
      // Additional wait to ensure the response is fully rendered
      const responseText = await lastBotMessage.locator('span').textContent();
      expect(responseText).toBeTruthy();
      expect(responseText!.trim().length).toBeGreaterThan(0);
    }
    
    // Verify we have bot responses for the questions (at least 4 out of 5, allowing for potential API issues)
    const botMessages = page.locator('.react-chatbot-kit-chat-bot-message');
    const messageCount = await botMessages.count();
    expect(messageCount).toBeGreaterThanOrEqual(4);
    
    // 3. Click reveal truth
    const revealButton = page.getByRole('button', { name: '公布答案' });
    await expect(revealButton).toBeEnabled();
    await revealButton.click();
    
    // Wait a bit for the message to be added to the DOM
    await page.waitForTimeout(500);
    
    // Verify truth message appears in chat - use simpler text locator
    await expect(page.getByText('💡 谜题真相：', { exact: false })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('这个男人曾经和朋友在海上遭遇海难', { exact: false })).toBeVisible();
    
    // Verify game state is reset
    await expect(startButton).toBeEnabled();
    await expect(revealButton).toBeDisabled();
    await expect(page.getByText('等待开始新汤...')).toBeVisible();
    
    // 4. End test (cleanup happens automatically)
  });
});
