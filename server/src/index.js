import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));

const http = createServer(app);
const io = new Server(http, { cors: { origin: 'http://localhost:5173' } });

app.get('/health', (_, res) => res.json({ ok: true }));

// ── 매칭 큐 & 방 ─────────────────────────────────────────────
const queue = [];         // 대기 중인 socket id
const rooms = new Map();  // roomId → { p1, p2 }

function createRoom(s1, s2) {
  const roomId = `room_${Date.now()}`;
  rooms.set(roomId, { p1: s1.id, p2: s2.id });
  s1.join(roomId);
  s2.join(roomId);
  s1.emit('matched', { roomId, side: 'p1' });
  s2.emit('matched', { roomId, side: 'p2' });
  console.log(`[room] ${roomId}: ${s1.id} vs ${s2.id}`);
}

function leaveQueue(socketId) {
  const idx = queue.indexOf(socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

function findRoom(socketId) {
  for (const [roomId, r] of rooms) {
    if (r.p1 === socketId || r.p2 === socketId) return { roomId, room: r };
  }
  return null;
}

// ── 소켓 이벤트 ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[+]', socket.id);

  socket.on('join_queue', () => {
    if (queue.includes(socket.id)) return;
    queue.push(socket.id);
    console.log(`[queue] size: ${queue.length}`);

    if (queue.length >= 2) {
      const s1 = io.sockets.sockets.get(queue.shift());
      const s2 = io.sockets.sockets.get(queue.shift());
      if (s1 && s2) createRoom(s1, s2);
    } else {
      socket.emit('waiting');
    }
  });

  // 빌드페이즈 단어 중계
  socket.on('build_word', ({ word }) => {
    const found = findRoom(socket.id);
    if (found) socket.to(found.roomId).emit('opponent_build', { word });
  });

  // 전투페이즈 단어 중계
  socket.on('battle_word', ({ word }) => {
    const found = findRoom(socket.id);
    if (found) socket.to(found.roomId).emit('opponent_battle', { word });
  });

  // 게임 종료
  socket.on('game_over', ({ winner }) => {
    const found = findRoom(socket.id);
    if (found) {
      socket.to(found.roomId).emit('opponent_game_over', { winner });
      rooms.delete(found.roomId);
    }
  });

  socket.on('disconnect', () => {
    leaveQueue(socket.id);
    const found = findRoom(socket.id);
    if (found) {
      socket.to(found.roomId).emit('opponent_disconnected');
      rooms.delete(found.roomId);
    }
    console.log('[-]', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`server :${PORT}`));
