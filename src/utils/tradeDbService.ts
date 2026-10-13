import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { ClosedTrade, AiTradeJournalEntry, SignalData } from '../types';

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
        const remoteTrades: ClosedTrade[] = [];
        snapshot.forEach((d) => {
          remoteTrades.push(d.data() as ClosedTrade);
        });
        // Real-time sync (empty if fresh start)
        onUpdate(remoteTrades);
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

// 2. Clear all trade history in Firestore (Admin fresh start button)
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
    return true;
  } catch (e) {
    console.error('Error clearing cloud trades', e);
    return false;
  }
}

// 3. Persist new closed trade to Firestore (real-time broadcast to all devices!)
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

// 5. Bot Running State: Start / Stop / Pause Trading AI in Cloud
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

// 6. Verify 6-digit PIN (Admin vs Member VIP)
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

// 7. VIP Payment Requests in Firestore
const VIP_REQUESTS_COLLECTION = 'vipRequests';

export async function submitVipPaymentRequest(request: import('../types').VipPaymentRequest): Promise<boolean> {
  try {
    await setDoc(doc(db, VIP_REQUESTS_COLLECTION, request.id), request);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${VIP_REQUESTS_COLLECTION}/${request.id}`);
    return false;
  }
}

export function subscribeToVipPaymentRequests(
  onUpdate: (requests: import('../types').VipPaymentRequest[]) => void
) {
  try {
    const q = query(collection(db, VIP_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const reqs: import('../types').VipPaymentRequest[] = [];
        snapshot.forEach((d) => reqs.push(d.data() as import('../types').VipPaymentRequest));
        onUpdate(reqs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, VIP_REQUESTS_COLLECTION);
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
    // Also save into local allowed list
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
