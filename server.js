const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory room viewer count tracker
const roomViewers = new Map();
// Rate limit tracker: userId -> [timestamp1, timestamp2, ...]
const userRateLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 4000;
  const maxLimit = 5;

  let timestamps = userRateLimits.get(userId) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxLimit) {
    return false; // rate limited
  }

  timestamps.push(now);
  userRateLimits.set(userId, timestamps);
  return true;
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Make io instance available globally so Next.js API routes can emit alerts if needed
  global.io = io;

  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUser = null;

    socket.on('join_room', ({ streamId, user }) => {
      currentRoom = `stream:${streamId}`;
      currentUser = user;
      socket.join(currentRoom);

      const count = (roomViewers.get(streamId) || 0) + 1;
      roomViewers.set(streamId, count);

      io.to(currentRoom).emit('viewer_count_update', { streamId, count });
    });

    socket.on('leave_room', ({ streamId }) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        const count = Math.max(0, (roomViewers.get(streamId) || 1) - 1);
        roomViewers.set(streamId, count);
        io.to(currentRoom).emit('viewer_count_update', { streamId, count });
        currentRoom = null;
      }
    });

    socket.on('send_chat_message', (data) => {
      const { streamId, user, body } = data;
      if (!streamId || !user || !body || !body.trim()) return;

      // Rate limit check
      if (!checkRateLimit(user.userId || user.id || socket.id)) {
        socket.emit('chat_error', { message: 'You are sending messages too fast. Please wait a moment.' });
        return;
      }

      // Basic profanity / harmful content filter
      const bannedWords = ['scam', 'phishing', 'botnet', 'malware', 'exploit'];
      const containsBanned = bannedWords.some((w) => body.toLowerCase().includes(w));

      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        streamId,
        userId: user.userId || user.id,
        username: user.username,
        role: user.role,
        badge: user.badge || null,
        body: containsBanned ? '[Flagged Message: Under Review]' : body.trim(),
        flagged: containsBanned,
        createdAt: new Date().toISOString(),
      };

      io.to(`stream:${streamId}`).emit('new_chat_message', messagePayload);
    });

    // Broadcast tip alert & goal progress update
    socket.on('broadcast_tip', (tipData) => {
      const { streamId } = tipData;
      if (streamId) {
        io.to(`stream:${streamId}`).emit('tip_alert', tipData);
      }
    });

    socket.on('goal_updated', (goalData) => {
      const { streamId } = goalData;
      if (streamId) {
        io.to(`stream:${streamId}`).emit('goal_updated', goalData);
      }
    });

    // Real-time Poll events
    socket.on('poll_created', (data) => {
      const { streamId } = data;
      if (streamId) {
        io.to(`stream:${streamId}`).emit('poll_created', data);
      }
    });

    socket.on('poll_voted', (data) => {
      const { streamId } = data;
      if (streamId) {
        io.to(`stream:${streamId}`).emit('poll_voted', data);
      }
    });

    socket.on('poll_closed', (data) => {
      const { streamId } = data;
      if (streamId) {
        io.to(`stream:${streamId}`).emit('poll_closed', data);
      }
    });

    // Private show coordination events
    socket.on('request_private_show', (requestData) => {
      const { streamId } = requestData;
      io.to(`stream:${streamId}`).emit('private_show_requested', requestData);
    });

    socket.on('respond_private_show', (response) => {
      const { streamId } = response;
      io.to(`stream:${streamId}`).emit('private_show_response', response);
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        const streamId = currentRoom.replace('stream:', '');
        const count = Math.max(0, (roomViewers.get(streamId) || 1) - 1);
        roomViewers.set(streamId, count);
        io.to(currentRoom).emit('viewer_count_update', { streamId, count });
      }
    });
  });

  const serverInstance = server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Live Streaming Web Server ready on http://${hostname}:${port}`);
  });

  // Graceful shutdown signals for zero-downtime rolling deploys on Render
  const gracefulShutdown = () => {
    console.log('> Received kill signal, gracefully shutting down server...');
    serverInstance.close(() => {
      console.log('> Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
