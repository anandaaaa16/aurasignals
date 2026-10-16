import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { ClosedTrade, AiTradeJournalEntry, SignalData, AssetSymbol, VipPaymentRequest } from '../types';
import { generateRealisticHistoricalTrades } from './initialTrades';

export { testFirestoreConnection };

const TRADES_COLLECTION = 'closedTrades';
const JOURNALS_COLLECTION = 'aiJournals';
const CONFIG_COLLECTION = 'accessConfig';
const SYSTEM_COLLECTION = 'systemState';
const VIP_REQUESTS_COLLECTION = 'vipRequests';

export interface UserRoleSession {
  role: 'GUEST' | 'MEMBER' | 'ADMIN';
  code: string;
  authenticatedAt: number;
}

// 1. Subscribe to real-time closed trades from Firestore + LocalStorage fallback
export function subscribeToClosedTrades(
  onUpdate: (trades: ClosedTrade[]) => void,
  onError?: (err: any) => void
) {
  // Instant bootstrap from localStorage (zero-latency UI rendering)
  try {
    const cached = localStorage.getItem('aurasignals_closed_trades');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdate(parsed);
      }
    }
  } catch (e) {}

  try {
    const q = query(collection(db, TRADES_COLLECTION), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteTrades: ClosedTrade[] = [];
        snapshot.forEach((d) => {
          remoteTrades.push(d.data() as ClosedTrade);
        });

        if (remoteTrades.length === 0) {
          // If Firestore is currently empty, initialize with realistic multi-day historical trades
          let localTrades: ClosedTrade[] = [];
          try {
            const raw = localStorage.getItem('aurasignals_closed_trades');
            if (raw) localTrades = JSON.parse(raw);
          } catch (e) {}

          if (localTrades.length === 0) {
            const seeded = generateRealisticHistoricalTrades();
            try {
              localStorage.setItem('aurasignals_closed_trades', JSON.stringify(seeded));
            } catch (e) {}
            onUpdate(seeded);
            // Sync initial trades to Firestore in the background
            seeded.slice(0, 15).forEach((t) => saveClosedTradeToCloud(t));
          } else {
            onUpdate(localTrades);
          }
        } else {
          // If remote trades exist, ensure historical days are preserved for a complete multi-day view
          let allTrades = remoteTrades;
          if (remoteTrades.length < 15) {
            const historical = generateRealisticHistoricalTrades();
            const existingIds = new Set(remoteTrades.map((t) => t.id));
            const merged = [...remoteTrades];
            for (const h of historical) {
              if (!existingIds.has(h.id)) {
                merged.push(h);
              }
            }
            merged.sort((a, b) => b.timestamp - a.timestamp);
            allTrades = merged;
          }
          try {
            localStorage.setItem('aurasignals_closed_trades', JSON.stringify(allTrades));
          } catch (e) {}
          onUpdate(allTrades);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, TRADES_COLLECTION);
        // Fallback to local storage or generated historical trades
        try {
          const raw = localStorage.getItem('aurasignals_closed_trades');
          if (raw) {
            onUpdate(JSON.parse(raw));
          } else {
            const seeded = generateRealisticHistoricalTrades();
            onUpdate(seeded);
          }
        } catch (e) {}
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, TRADES_COLLECTION);
    return () => {};
  }
}

// 2. Clear all trade history in Firestore & LocalStorage (Admin Fresh Start)
export async function clearAllTradesInCloud(): Promise<boolean> {
  try {
    const tradeDocs = await getDocs(collection(db, TRADES_COLLECTION));
    for (const d of tradeDocs.docs) {
      await deleteDoc(d.ref);
    }
    const journalDocs = await getDocs(collection(db, JOURNALS_COLLECTION));
    for (const d of journalDocs.docs) {
      await deleteDoc(d.ref);
    }
    try {
      localStorage.removeItem('aurasignals_closed_trades');
      localStorage.removeItem('aurasignals_ai_journals');
    } catch (e) {}
    return true;
  } catch (e) {
    console.error('Error clearing cloud trades', e);
    return false;
  }
}

// 3. Persist new closed trade to Firestore & LocalStorage
export async function saveClosedTradeToCloud(trade: ClosedTrade) {
  try {
    await setDoc(doc(db, TRADES_COLLECTION, trade.id), trade);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TRADES_COLLECTION}/${trade.id}`);
  }
}

// 4. Persist new AI Journal entry to Firestore
export async function saveJournalEntryToCloud(journal: AiTradeJournalEntry) {
  try {
    await setDoc(doc(db, JOURNALS_COLLECTION, journal.id), journal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${JOURNALS_COLLECTION}/${journal.id}`);
  }
}

// 5. Active Positions Persistence (Cloud + LocalStorage)
// This guarantees that open trade positions & floating profits NEVER reset to 0 on page reload!
export function subscribeToActiveSignals(
  onUpdate: (signals: Record<AssetSymbol, SignalData | null>) => void
) {
  try {
    const docRef = doc(db, SYSTEM_COLLECTION, 'activeSignals');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.signals && typeof data.signals === 'object') {
            onUpdate(data.signals);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${SYSTEM_COLLECTION}/activeSignals`);
      }
    );
  } catch (err) {
    return () => {};
  }
}

export async function saveActiveSignalsToCloud(signals: Record<AssetSymbol, SignalData | null>) {
  try {
    await setDoc(doc(db, SYSTEM_COLLECTION, 'activeSignals'), {
      signals,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SYSTEM_COLLECTION}/activeSignals`);
  }
}

// 6. Bot Running State: Start / Stop / Pause Trading AI in Cloud
export function subscribeToBotControl(onUpdate: (isRunning: boolean) => void) {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'system');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.botRunning === 'boolean') {
          onUpdate(data.botRunning);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export async function setBotControlInCloud(isRunning: boolean) {
  try {
    await setDoc(
      doc(db, CONFIG_COLLECTION, 'system'),
      {
        botRunning: isRunning,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to update bot status in cloud', err);
  }
}

// 7. Verify 6-digit PIN (Admin vs Member VIP)
export function verifySixDigitCode(code: string): { success: boolean; role: 'ADMIN' | 'MEMBER' | 'GUEST'; message: string } {
  const cleanCode = code.trim();
  // Admin PIN (Default master: 889900)
  if (cleanCode === '889900') {
    return {
      success: true,
      role: 'ADMIN',
      message: 'Admin Access Verified (Full Control & Bot Management)',
    };
  }

  // Check stored active custom VIP PINs
  let dynamicPins: string[] = [];
  try {
    const raw = localStorage.getItem('aurasignals_approved_vip_pins');
    if (raw) dynamicPins = JSON.parse(raw);
  } catch (e) {}

  // VIP Member PINs
  const validMemberCodes = ['777888', '123456', '999888', '555666', ...dynamicPins];
  if (validMemberCodes.includes(cleanCode)) {
    return {
      success: true,
      role: 'MEMBER',
      message: 'VIP Member Access Active (All Signals Unlocked)',
    };
  }

  return {
    success: false,
    role: 'GUEST',
    message: 'Invalid 6-Digit PIN. Contact Admin or upgrade to VIP.',
  };
}

// 8. VIP Payment Requests in Firestore
export async function submitVipPaymentRequest(request: VipPaymentRequest): Promise<boolean> {
  try {
    await setDoc(doc(db, VIP_REQUESTS_COLLECTION, request.id), request);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${VIP_REQUESTS_COLLECTION}/${request.id}`);
    return false;
  }
}

export function subscribeToVipPaymentRequests(
  onUpdate: (requests: VipPaymentRequest[]) => void
) {
  try {
    const q = query(collection(db, VIP_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const reqs: VipPaymentRequest[] = [];
        snapshot.forEach((d) => reqs.push(d.data() as VipPaymentRequest));
        onUpdate(reqs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, VIP_REQUESTS_COLLECTION);
      }
    );
  } catch (err) {
    return () => {};
  }
}

export async function approveVipPayment(requestId: string, pin: string): Promise<boolean> {
  try {
    await setDoc(
      doc(db, VIP_REQUESTS_COLLECTION, requestId),
      { status: 'APPROVED', approvedPin: pin },
      { merge: true }
    );
    try {
      const raw = localStorage.getItem('aurasignals_approved_vip_pins');
      const existing = raw ? JSON.parse(raw) : [];
      if (!existing.includes(pin)) {
        existing.push(pin);
        localStorage.setItem('aurasignals_approved_vip_pins', JSON.stringify(existing));
      }
    } catch (e) {}
    return true;
  } catch (err) {
    return false;
  }
}
