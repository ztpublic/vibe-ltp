/**
 * Mock data generators for Storybook stories
 */

import type { ChatMessage, UserMessage, BotMessage } from '@vibe-ltp/shared';

export const samplePuzzle = {
  soupSurface: '一个男人走进酒吧，点了一杯水。酒保突然拔出枪指着他。男人说了声"谢谢"就离开了。',
  soupTruth: '这个男人患有打嗝症。他走进酒吧是想喝水来止住打嗝。酒保意识到了这一点，用枪吓唬他，让他受到惊吓后打嗝停止了。男人感谢酒保后离开。',
};

export const longPuzzle = {
  soupSurface: `在一个偏远的小镇上，有一座古老的图书馆。每到深夜，总能听到图书馆里传来翻书的声音。
  
镇上的人们都说图书馆闹鬼，因为图书管理员每天晚上锁门后，第二天早上总会发现有些书被移动过位置。有些书甚至被打开，停留在某一页上。

最奇怪的是，这些书都是关于同一个主题的——海洋生物学。而且被翻开的页面总是关于章鱼的内容。

图书管理员决定在图书馆安装摄像头。第二天查看录像时，他惊讶地发现了真相。`,
  soupTruth: `真相是：图书馆附近有一个海洋研究所，他们养了一只高智商的章鱼。
  
这只章鱼逃出了水族箱，通过下水道系统进入了图书馆的地下室，然后爬到阅览室。它对人类的知识非常好奇，特别是关于自己物种的信息。
  
章鱼利用它的触手翻阅书籍，并且能够识别图片。它专门寻找带有章鱼插图的书籍，然后停留在那些页面上。
  
摄像头拍到了这只章鱼的夜间"阅读"行为。研究所的科学家们后来证实，这只章鱼确实具有非凡的学习能力和好奇心。`,
};

/**
 * Generate a conversation with specified number of messages
 */
export function generateMockConversation(count: number): ChatMessage[] {
  const questions = [
    '这个男人认识酒保吗？',
    '男人来酒吧的目的是喝水吗？',
    '酒保为什么要拔枪？',
    '这和男人的健康状况有关吗？',
    '男人有生命危险吗？',
    '酒保的行为是善意的吗？',
    '这个故事发生在现代吗？',
    '男人说谢谢是因为酒保帮了他吗？',
    '水有什么特殊作用吗？',
    '酒保开枪了吗？',
    '这个男人有打嘏吗？',
    '酒保用枪吓弄他是为了让他打嘏停止吗？',
  ];

  const answers = [
    '不一定，可能不认识。',
    '是的，他确实想喝水。',
    '这是解决问题的一种方式。',
    '是的，与健康有关。',
    '没有生命危险。',
    '是的，酒保是在帮他。',
    '是的，现代故事。',
    '是的，酒保帮助了他。',
    '水能够缓解他的症状。',
    '没有开枪，只是吓弄。',
    '是的，他在打嘏。',
    '完全正确！',
  ];

  const messages: ChatMessage[] = [];
  const messagesToGenerate = Math.min(count, questions.length * 2);

  for (let i = 0; i < messagesToGenerate; i++) {
    const questionIndex = Math.floor(i / 2);
    
    if (i % 2 === 0) {
      // User message
      const userMsg: UserMessage = {
        id: `user_${i}`,
        type: 'user',
        content: questions[questionIndex] || `问题 ${i + 1}`,
        nickname: `玩家${(i % 3) + 1}`,
        timestamp: new Date(Date.now() - (messagesToGenerate - i) * 60000).toISOString(),
      };
      messages.push(userMsg);
    } else {
      // Bot message with reply metadata
      const botMsg: BotMessage = {
        id: `bot_${i}`,
        type: 'bot',
        content: answers[questionIndex] || `回答 ${i + 1}`,
        timestamp: new Date(Date.now() - (messagesToGenerate - i) * 60000 + 5000).toISOString(),
        replyMetadata: {
          replyToId: `user_${i - 1}`,
          replyToPreview: (questions[questionIndex] || `问题 ${i}`).substring(0, 40),
          replyToNickname: `玩家${((i - 1) % 3) + 1}`,
        },
      };
      messages.push(botMsg);
    }
  }

  return messages;
}

/**
 * Generate messages with error examples
 */
export function generateMessagesWithErrors(): ChatMessage[] {
  const userMsg1: UserMessage = {
    id: 'user_1',
    type: 'user',
    content: '这个男人认识酒保吗？',
    nickname: '玩家1',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  };

  const botMsg1: BotMessage = {
    id: 'bot_1',
    type: 'bot',
    content: '不一定，可能不认识。',
    timestamp: new Date(Date.now() - 295000).toISOString(),
    replyMetadata: {
      replyToId: 'user_1',
      replyToPreview: '这个男人认识酒保吗？',
      replyToNickname: '玩家1',
    },
  };

  const userMsg2: UserMessage = {
    id: 'user_2',
    type: 'user',
    content: '男人来酒吧的目的是喝水吗？',
    nickname: '玩家2',
    timestamp: new Date(Date.now() - 200000).toISOString(),
  };

  const botMsg2: BotMessage = {
    id: 'bot_2',
    type: 'bot',
    content: '❌ 错误: 服务器连接超时，请重试。',
    timestamp: new Date(Date.now() - 195000).toISOString(),
    replyMetadata: {
      replyToId: 'user_2',
      replyToPreview: '男人来酒吧的目的是喝水吗？',
      replyToNickname: '玩家2',
    },
  };

  const userMsg3: UserMessage = {
    id: 'user_3',
    type: 'user',
    content: '男人来酒吧的目的是喝水吗？',
    nickname: '玩家2',
    timestamp: new Date(Date.now() - 100000).toISOString(),
  };

  const botMsg3: BotMessage = {
    id: 'bot_3',
    type: 'bot',
    content: '是的，他确实想喝水。',
    timestamp: new Date(Date.now() - 95000).toISOString(),
    replyMetadata: {
      replyToId: 'user_3',
      replyToPreview: '男人来酒吧的目的是喝水吗？',
      replyToNickname: '玩家2',
    },
  };

  return [userMsg1, botMsg1, userMsg2, botMsg2, userMsg3, botMsg3];
}
