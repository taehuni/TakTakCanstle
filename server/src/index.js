import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));

const http = createServer(app);
const io = new Server(http, { cors: { origin: 'http://localhost:5173' } });

app.get('/health', (_, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  socket.on('disconnect', () => console.log('disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`server :${PORT}`));
