import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const http = createServer(app);
const io = new Server(http, { cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173' } });

app.get('/health', (_, res) => res.json({ ok: true }));

// ── 랭킹 ─────────────────────────────────────────────────────────────
const scores = []; // 메모리 저장 (서버 재시작 시 초기화)

app.post('/submit-score', (req, res) => {
  const { name, score, won, wordsTyped, wpm, kills } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ ok: false });
  const entry = { name: (name || '익명').slice(0, 12), score, won: !!won, wordsTyped, wpm, kills, ts: Date.now() };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > 200) scores.splice(200);
  const rank = scores.indexOf(entry) + 1;
  res.json({ ok: true, rank });
});

app.get('/scores', (_, res) => {
  res.json(scores.slice(0, 30));
});

// ── 매칭 큐 & 방 ─────────────────────────────────────────────
const queue       = [];          // 일반 대기열
const rankedQueue = [];          // 랭크 대기열 [{ socketId, lp }]
const rooms       = new Map();   // roomId → { p1, p2, mode }
const rematches   = new Map();   // roomId → Set of socket ids who want rematch
const customRooms = new Map();   // code → { socketId } 커스텀 방 대기

function genRoomCode() {
  let code;
  do { code = Math.random().toString(36).slice(2, 8).toUpperCase(); } while (customRooms.has(code));
  return code;
}

function createRoom(s1, s2, mode = 'normal', extraP1 = {}, extraP2 = {}) {
  const roomId = `${mode}_${Date.now()}`;
  rooms.set(roomId, { p1: s1.id, p2: s2.id, mode });
  s1.join(roomId);
  s2.join(roomId);
  s1.emit('matched', { roomId, side: 'p1', mode, ...extraP1 });
  s2.emit('matched', { roomId, side: 'p2', mode, ...extraP2 });
  console.log(`[${mode}] ${roomId}: ${s1.id} vs ${s2.id}`);
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
      if (s1 && s2) createRoom(s1, s2, 'normal');
    } else {
      socket.emit('waiting');
    }
  });

  socket.on('join_ranked_queue', ({ lp = 0 } = {}) => {
    if (rankedQueue.find(q => q.socketId === socket.id)) return;
    rankedQueue.push({ socketId: socket.id, lp });
    console.log(`[ranked] size: ${rankedQueue.length}`);

    if (rankedQueue.length >= 2) {
      const p1d = rankedQueue.shift();
      const p2d = rankedQueue.shift();
      const s1 = io.sockets.sockets.get(p1d.socketId);
      const s2 = io.sockets.sockets.get(p2d.socketId);
      if (s1 && s2) {
        createRoom(s1, s2, 'ranked',
          { opponentLp: p2d.lp },
          { opponentLp: p1d.lp },
        );
      }
    } else {
      socket.emit('waiting');
    }
  });

  // 커스텀 방 만들기
  socket.on('create_custom_room', () => {
    // 기존 대기 중인 방 제거
    for (const [code, r] of customRooms) {
      if (r.socketId === socket.id) { customRooms.delete(code); break; }
    }
    const code = genRoomCode();
    customRooms.set(code, { socketId: socket.id });
    socket.emit('room_code', { code });
    console.log(`[custom] ${code} created by ${socket.id}`);
  });

  // 커스텀 방 참가
  socket.on('join_custom_room', ({ code }) => {
    const upper = (code || '').toUpperCase();
    const entry = customRooms.get(upper);
    if (!entry) {
      socket.emit('room_error', { msg: '방 코드가 올바르지 않습니다.' });
      return;
    }
    if (entry.socketId === socket.id) {
      socket.emit('room_error', { msg: '자신의 방에는 참가할 수 없습니다.' });
      return;
    }
    const host = io.sockets.sockets.get(entry.socketId);
    if (!host) {
      customRooms.delete(upper);
      socket.emit('room_error', { msg: '방장이 연결을 끊었습니다.' });
      return;
    }
    customRooms.delete(upper);
    createRoom(host, socket, 'custom');
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

  // 게임 종료 (방은 유지 — 재매칭 대기)
  socket.on('game_over', ({ winner }) => {
    const found = findRoom(socket.id);
    if (found) {
      socket.to(found.roomId).emit('opponent_game_over', { winner });
    }
  });

  // 재매칭 요청
  socket.on('rematch_request', () => {
    const found = findRoom(socket.id);
    if (!found) return;
    const { roomId } = found;

    if (!rematches.has(roomId)) rematches.set(roomId, new Set());
    rematches.get(roomId).add(socket.id);

    // 상대방에게 알림
    socket.to(roomId).emit('opponent_wants_rematch');

    // 둘 다 동의하면 재시작
    const room = rooms.get(roomId);
    if (room && rematches.get(roomId).size >= 2) {
      io.to(roomId).emit('rematch_ready');
      rematches.delete(roomId);
    }
  });

  socket.on('disconnect', () => {
    leaveQueue(socket.id);
    const ri = rankedQueue.findIndex(q => q.socketId === socket.id);
    if (ri !== -1) rankedQueue.splice(ri, 1);
    for (const [code, r] of customRooms) {
      if (r.socketId === socket.id) { customRooms.delete(code); break; }
    }
    const found = findRoom(socket.id);
    if (found) {
      socket.to(found.roomId).emit('opponent_disconnected');
      rooms.delete(found.roomId);
      rematches.delete(found.roomId);
    }
    console.log('[-]', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`server :${PORT}`));
