import { Router } from 'express';

export const roomRoutes = Router();

// GET /api/rooms - List all rooms
roomRoutes.get('/', async (_req, res) => {
  try {
    // TODO: Implement with Prisma
    res.json({ rooms: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/rooms - Create a new room
roomRoutes.post('/', async (req, res) => {
  try {
    const data = req.body;
    // TODO: Validate and create room with Prisma
    res.status(201).json({ room: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:id - Get room details
roomRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Implement with Prisma
    res.json({ room: null, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});
