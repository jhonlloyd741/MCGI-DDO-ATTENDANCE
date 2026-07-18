// IndexedDB Client helper for transaction-safe high-capacity offline queuing

const DB_NAME = 'mcgi-ddo-offline-db';
const STORE_NAME = 'pending-submissions';
const DB_VERSION = 1;

export interface OfflineSubmission {
  id: string;
  type: 'attendance' | 'member-registration';
  payload: any;
  timestamp: string;
}

export function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function queueOfflineSubmission(submission: Omit<OfflineSubmission, 'timestamp'>): Promise<void> {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record: OfflineSubmission = {
      ...submission,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => {
        console.log(`✨ Successfully queued offline submission in IndexedDB [ID: ${record.id}]`);
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Failed to queue in IndexedDB:', error);
    throw error;
  }
}

export async function getQueuedSubmissions(): Promise<OfflineSubmission[]> {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Failed to retrieve from IndexedDB:', error);
    return [];
  }
}

export async function dequeueOfflineSubmission(id: string): Promise<void> {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`🗑️ Removed synced submission from IndexedDB [ID: ${id}]`);
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Failed to dequeue from IndexedDB:', error);
    throw error;
  }
}

export async function clearAllQueuedSubmissions(): Promise<void> {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('🧹 Cleared IndexedDB pending queue');
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Failed to clear IndexedDB:', error);
    throw error;
  }
}
