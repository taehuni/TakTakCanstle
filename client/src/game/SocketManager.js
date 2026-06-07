import { io } from 'socket.io-client';

const SERVER = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');

export class SocketManager {
  constructor() {
    this.socket   = null;
    this.handlers = {};
  }

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(SERVER);
    this.socket.on('connect',    (...args) => this.handlers['connect']?.(...args));
    this.socket.on('disconnect', (...args) => this.handlers['disconnect']?.(...args));
    this.socket.onAny((event, ...args) => {
      this.handlers[event]?.(...args);
    });
  }

  on(event, fn) { this.handlers[event] = fn; }
  off(event)    { delete this.handlers[event]; }

  joinQueue()             { this.socket?.emit('join_queue'); }
  joinRankedQueue(lp)     { this.socket?.emit('join_ranked_queue', { lp }); }
  createCustomRoom()      { this.socket?.emit('create_custom_room'); }
  joinCustomRoom(code)    { this.socket?.emit('join_custom_room', { code }); }
  sendBuildWord(word)     { this.socket?.emit('build_word',  { word }); }
  sendBattleWord(word)    { this.socket?.emit('battle_word', { word }); }
  sendGameOver(winner)    { this.socket?.emit('game_over',   { winner }); }
  sendRematchRequest()    { this.socket?.emit('rematch_request'); }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.handlers = {};
  }

  get id() { return this.socket?.id; }
}
