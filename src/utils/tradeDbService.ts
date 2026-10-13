import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { ClosedTrade, AiTradeJournalEntry } from '../types';
import { INITIAL_TRADES } from './initialTrades';
import { INITIAL_AI_JOURNALS } from './aiTradingAgent';

export { testFirestoreConnection };

const TRADES_COLLECTION = 'closedTrades';
const JOURNALS_COLLECTION = 'aiJournals';
const CONFIG_COLLECTION = 'accessConfig';

export interface UserRoleSession {
  role: 'GUEST' | 'MEMBER' | 'ADMIN';
  code: string;
  authenticatedAt: number;
}

// 1. Subscribe to real-time closed trades from Firestore
export function subscribeToClosedTrades(
  onUpdate: (trades: ClosedTrade[]) => void,
  onError?: (err: any) => void
) {
  try {
    const q = query(collection(db, TRADES_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteTrades: ClosedTrade[] = [];
          snapshot.forEach((d) => {
            remoteTrades.push(d.data() as ClosedTrade);
          });
          onUpdate(remoteTrades);
        } else {
          // If Firestore is still empty, seed initial historical trades
          seedInitialTradesToFirestore();
          onUpdate(INITIAL_TRADES);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, TRADES_COLLECTION);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, TRADES_COLLECTION);
    return () => {};
  }
}

// Seed initial trades to Firestore so new devices immediately see rich history
export async function seedInitialTradesToFirestore() {
  try {
    for (const trade of INITIAL_TRADES.slice(0, 8)) {
      await setDoc(doc(db, TRADES_COLLECTION, trade.id), trade);
    }
    for (const journal of INITIAL_AI_JOURNALS) {
      await setDoc(doc(db, JOURNALS_COLLECTION, journal.id), journal);
    }
    // Initialize default access codes
    await setDoc(doc(db, CONFIG_COLLECTION, 'system'), {
      adminPin: '889900',
      vipCodes: ['VIP777', 'MEMBER8', 'AURA99'],
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn('Seeding to Firestore skipped or completed', e);
  }
}

// 2. Persist new closed trade to Firestore (real-time broadcast to all devices!)
export async function saveClosedTradeToCloud(trade: ClosedTrade) {
  try {
    await setDoc(doc(db, TRADES_COLLECTION, trade.id), trade);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TRADES_COLLECTION}/${trade.id}`);
  }
}

// 3. Persist new AI Journal entry to Firestore
export async function saveJournalEntryToCloud(journal: AiTradeJournalEntry) {
  try {
    await setDoc(doc(db, JOURNALS_COLLECTION, journal.id), journal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${JOURNALS_COLLECTION}/${journal.id}`);
  }
}

// 4. Verify 6-digit PIN (Admin vs Member VIP)
export function verifySixDigitCode(code: string): { success: boolean; role: 'ADMIN' | 'MEMBER' | 'GUEST'; message: string } {
  const cleanCode = code.trim();

  // Admin PIN (Default master: 889900)
  if (cleanCode === '889900') {
    return {
      success: true,
      role: 'ADMIN',
      message: 'Akses Admin Terverifikasi (Full Control)',
    };
  }

  // VIP Member PINs (e.g. 777888, 123456, VIP777)
  const validMemberCodes = ['777888', '123456', '999888', '555666'];
  if (validMemberCodes.includes(cleanCode)) {
    return {
      success: true,
      role: 'MEMBER',
      message: 'Akses VIP Member Aktif (Real-Time Signals)',
    };
  }

  return {
    success: false,
    role: 'GUEST',
    message: 'Kode 6-Digit Tidak Ditemukan atau Tidak Valid',
  };
}
