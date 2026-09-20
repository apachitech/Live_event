const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Auto-align Prisma schema datasource provider with DATABASE_URL
const rawDbUrl = (process.env.DATABASE_URL || '').trim();
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');

if (rawDbUrl && fs.existsSync(schemaPath)) {
  try {
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');
    const currentProvider = schemaContent.includes('provider = "postgresql"') ? 'postgresql' : 'sqlite';
    const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

    if (currentProvider !== targetProvider || isPostgres) {
      console.log(`> Aligning and synchronizing Prisma schema with ${targetProvider} database...`);
      const ensureScript = path.join(__dirname, 'scripts', 'ensure-db.js');
      execSync(`node "${ensureScript}"`, { stdio: 'inherit' });
      console.log(`> Prisma client and schema successfully aligned for ${targetProvider}`);
    }
  } catch (err) {
    console.error('> Notice during Prisma provider alignment:', err.message);
  }
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, port });
const handle = app.getRequestHandler();

// Lazy Prisma Client for hard-copying live chat and change data
let prismaClient = null;
function getPrisma() {
  if (!prismaClient) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prismaClient = new PrismaClient();
    } catch (e) {
      console.error('> Notice: Unable to initialize Prisma in server.js:', e.message);
    }
  }
  return prismaClient;
}

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

let isAppReady = false;

const server = createServer(async (req, res) => {
  // Immediate lightweight health check for Render port scanner
  if (req.url === '/healthz' || req.url === '/ping') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    return res.end('OK');
  }

  // Wait if Next.js app is still preparing
  if (!isAppReady) {
    const start = Date.now();
    while (!isAppReady && Date.now() - start < 10000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!isAppReady) {
      res.statusCode = 503;
      res.setHeader('Retry-After', '2');
      return res.end('Server initializing, please retry in a moment...');
    }
  }

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

    socket.on('send_chat_message', async (data) => {
      const { streamId, user, body } = data;
      if (!streamId || !user || !body || !body.trim()) return;

      const userId = user.userId || user.id;

      // Rate limit check
      if (!checkRateLimit(userId || socket.id)) {
        socket.emit('chat_error', { message: 'You are sending messages too fast. Please wait a moment.' });
        return;
      }

      // Basic profanity / harmful content filter
      const bannedWords = ['scam', 'phishing', 'botnet', 'malware', 'exploit'];
      const containsBanned = bannedWords.some((w) => body.toLowerCase().includes(w));
      const cleanBody = containsBanned ? '[Flagged Message: Under Review]' : body.trim();

      let savedId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let createdAtStr = new Date().toISOString();

      // Hard copy chat message to database
      try {
        const db = getPrisma();
        if (db && userId && userId !== 'guest') {
          const dbUser = await db.user.findUnique({ where: { id: userId } });
          if (dbUser) {
            const savedMsg = await db.chatMessage.create({
              data: {
                streamId,
                userId: dbUser.id,
                body: cleanBody,
                flagged: containsBanned,
              },
            });
            savedId = savedMsg.id;
            createdAtStr = savedMsg.createdAt.toISOString();

            // Hard copy change data / audit log if message was flagged
            if (containsBanned) {
              await db.auditLog.create({
                data: {
                  actorUserId: dbUser.id,
                  action: 'CHAT_MESSAGE_FLAGGED',
                  entityType: 'ChatMessage',
                  entityId: savedMsg.id,
                  payload: JSON.stringify({ originalBody: body.trim(), streamId }),
                },
              });
            }
          }
        }
      } catch (err) {
        console.error('> Notice: Failed to hard-copy chat message to DB:', err.message);
      }

      const messagePayload = {
        id: savedId,
        streamId,
        userId: userId || 'guest',
        username: user.username || 'Guest',
        role: user.role || 'VIEWER',
        badge: user.badge || null,
        body: cleanBody,
        flagged: containsBanned,
        createdAt: createdAtStr,
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

    // Pinned chat announcement from streamer
    socket.on('pinned_announcement', async (data) => {
      const { streamId, announcement, userId } = data;
      if (streamId) {
        io.to(`stream:${streamId}`).emit('pinned_announcement', announcement);
        try {
          const db = getPrisma();
          if (db) {
            await db.auditLog.create({
              data: {
                actorUserId: userId || null,
                action: announcement ? 'PINNED_ANNOUNCEMENT_SET' : 'PINNED_ANNOUNCEMENT_CLEARED',
                entityType: 'Stream',
                entityId: streamId,
                payload: JSON.stringify({ announcement }),
              },
            });
          }
        } catch (err) {
          console.error('> Notice: Failed to hard-copy pinned announcement to DB:', err.message);
        }
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

    // ---------------------------------------------------------------------------
    // WebRTC Native Camera Stream Signaling & Relay
    // ---------------------------------------------------------------------------
    // Broadcaster announces live camera feed availability
    socket.on('webrtc_broadcaster_ready', ({ streamId }) => {
      socket.broadcast.to(`stream:${streamId}`).emit('webrtc_broadcaster_available', {
        streamId,
        broadcasterSocketId: socket.id,
      });
    });

    // Viewer requests direct camera stream from broadcaster
    socket.on('webrtc_viewer_join', ({ streamId }) => {
      socket.broadcast.to(`stream:${streamId}`).emit('webrtc_viewer_joined', {
        streamId,
        viewerSocketId: socket.id,
      });
    });

    // Broadcaster sends SDP offer to specific viewer
    socket.on('webrtc_signal_offer', ({ targetSocketId, offer, streamId }) => {
      io.to(targetSocketId).emit('webrtc_signal_offer', {
        broadcasterSocketId: socket.id,
        offer,
        streamId,
      });
    });

    // Viewer sends SDP answer back to broadcaster
    socket.on('webrtc_signal_answer', ({ targetSocketId, answer, streamId }) => {
      io.to(targetSocketId).emit('webrtc_signal_answer', {
        viewerSocketId: socket.id,
        answer,
        streamId,
      });
    });

    // ICE Candidate exchange between broadcaster and viewer
    socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate, streamId }) => {
      io.to(targetSocketId).emit('webrtc_ice_candidate', {
        fromSocketId: socket.id,
        candidate,
        streamId,
      });
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

  const serverInstance = server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Web Server listening immediately on http://${hostname}:${port}`);
  });

  // Prepare Next.js asynchronously in background without blocking port scan
  app.prepare()
    .then(() => {
      isAppReady = true;
      console.log(`> Next.js application ready and serving traffic!`);
    })
    .catch((err) => {
      console.error('> Error during Next.js app.prepare():', err);
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
