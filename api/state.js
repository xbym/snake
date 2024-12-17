import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 保存状态
    const gameState = req.body;
    await kv.set('snakeState', gameState);
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    // 获取状态
    const gameState = await kv.get('snakeState');
    res.status(200).json(gameState);
  }
} 