import type { User } from '@/types';

const DB_NAME = 'quincaillerie-erp-auth';
const DB_VERSION = 1;
const STORE_NAME = 'users';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('role', 'role', { unique: false });
      }
    };
  });
}

function runTransaction(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => {
      resolve();
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

function readTransaction<T>(
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => {
      resolve(request.result);
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function getAllUsers(): Promise<User[]> {
  return readTransaction((store) => store.getAll());
}

export async function addUser(user: User): Promise<void> {
  return runTransaction('readwrite', (store) => store.add(user));
}

export async function updateUser(user: User): Promise<void> {
  return runTransaction('readwrite', (store) => store.put(user));
}

export async function deleteUser(id: string): Promise<void> {
  return runTransaction('readwrite', (store) => store.delete(id));
}

export async function getUserCount(): Promise<number> {
  return readTransaction((store) => store.count());
}
