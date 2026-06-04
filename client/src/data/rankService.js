import { db } from '../firebase.js';
import {
  collection, addDoc, doc, getDoc, setDoc, runTransaction,
  query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';

// ── 일반 게임 점수 ────────────────────────────────────────────────
const SCORES_COL = 'scores';

export async function submitScore({ uid, name, score, won, wpm, wordsTyped, kills }) {
  await addDoc(collection(db, SCORES_COL), {
    uid: uid || null, name: name || '익명',
    score: score || 0, won: !!won,
    wpm: wpm || 0, wordsTyped: wordsTyped || 0, kills: kills || 0,
    createdAt: Date.now(),
  });
}

export function subscribeTopScores(n = 30, callback) {
  const q = query(collection(db, SCORES_COL), orderBy('score', 'desc'), limit(n));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── 랭크 시스템 ───────────────────────────────────────────────────
const USERS_COL = 'users';

export const TIERS = [
  { name: '브론즈',   min:    0, color: '#cd7f32', emoji: '🥉' },
  { name: '실버',     min:  500, color: '#94a3b8', emoji: '🥈' },
  { name: '골드',     min: 1000, color: '#fde047', emoji: '🏆' },
  { name: '플래티넘', min: 1500, color: '#4ade80', emoji: '💚' },
  { name: '다이아몬드', min: 2000, color: '#67e8f9', emoji: '💎' },
];

export function getTier(lp = 0) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lp >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

// ELO 기반 LP 변동
export function calcLpChange(myLp = 0, opponentLp = 0, won) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentLp - myLp) / 400));
  return Math.round(K * (won ? (1 - expected) : -expected));
}

export async function getUserRank(uid) {
  if (!uid) return { lp: 0, wins: 0, losses: 0 };
  const snap = await getDoc(doc(db, USERS_COL, uid));
  return snap.exists() ? snap.data() : { lp: 0, wins: 0, losses: 0 };
}

export async function updateUserRank(uid, name, lpChange, won) {
  const ref = doc(db, USERS_COL, uid);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const cur  = snap.exists() ? snap.data() : { lp: 0, wins: 0, losses: 0 };
    const newLp = Math.max(0, (cur.lp || 0) + lpChange);
    tx.set(ref, {
      name: name || '익명',
      lp:     newLp,
      wins:   (cur.wins   || 0) + (won ? 1 : 0),
      losses: (cur.losses || 0) + (won ? 0 : 1),
      updatedAt: Date.now(),
    });
    return newLp;
  });
}

export function subscribeTopRanks(n = 30, callback) {
  const q = query(collection(db, USERS_COL), orderBy('lp', 'desc'), limit(n));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
