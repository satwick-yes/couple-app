import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
type TouchPayload = { x: number, y: number, timestamp: number };

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join the couple's private room
    socket.on('join_room', ({ coupleId, userId }: { coupleId: string, userId: string }) => {
      socket.join(coupleId);
      socket.data.userId = userId;
      socket.data.coupleId = coupleId;
      
      // Notify partner
      socket.to(coupleId).emit('partner_status', { isOnline: true });
    });

    // Handle Thumbkiss coordinates
    socket.on('touch_start', (payload: TouchPayload) => {
      if (socket.data.coupleId) {
        socket.to(socket.data.coupleId).emit('partner_touch_start', payload);
      }
    });

    socket.on('touch_move', (payload: TouchPayload) => {
      if (socket.data.coupleId) {
        socket.to(socket.data.coupleId).emit('partner_touch_move', payload);
        
        // Simple mock matching logic (In a real app, calculate distance server-side)
        // If close enough, trigger haptic match
        // io.to(socket.data.coupleId).emit('haptic_match', { intensity: 'heavy' });
      }
    });

    socket.on('touch_end', () => {
      if (socket.data.coupleId) {
        socket.to(socket.data.coupleId).emit('partner_touch_end');
      }
    });

    // Disconnection logic
    socket.on('disconnect', () => {
      console.log('User disconnected');
      if (socket.data.coupleId) {
        socket.to(socket.data.coupleId).emit('partner_status', { isOnline: false });
      }
    });
  });

  // Let Next.js handle all other routes (API routes, etc.)
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Real-time Backend ready on http://localhost:${PORT}`);
  });
});
