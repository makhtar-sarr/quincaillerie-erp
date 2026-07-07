import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6Gy3Gi8Rpgm0G2voER-4x8jEQuUYwn9Q",
  authDomain: "yarling-granite-1w1xt.firebaseapp.com",
  projectId: "yarling-granite-1w1xt",
  storageBucket: "yarling-granite-1w1xt.firebasestorage.app",
  messagingSenderId: "601326402412",
  appId: "1:601326402412:web:7efef240f5be2655129149"
};

let db: any = null;
let auth: any = null;
let isFirebaseAvailable = false;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // Using the custom databaseId provided in firebase-applet-config.json
  db = getFirestore(app, "ai-studio-quincaillerieerp-01dbbb07-ab5e-4383-9dd0-31f88dcf84a7");
  auth = getAuth(app);
  isFirebaseAvailable = true;
} catch (error) {
  console.error("Firebase failed to initialize:", error);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CloudBackup {
  id: string;
  createdAt: string;
  label: string;
  operator: string;
  data: {
    settings: any;
    items: any[];
    movements: any[];
    customers: any[];
    suppliers: any[];
    quotes: any[];
    invoices: any[];
  };
}

export { db, auth, isFirebaseAvailable };

export async function saveBackupToCloud(label: string, operator: string, data: any): Promise<string> {
  if (!isFirebaseAvailable || !db) {
    throw new Error("Le service de sauvegarde Cloud n'est pas connecté.");
  }

  const backupData = {
    createdAt: new Date().toISOString(),
    label: label || "Sauvegarde manuelle",
    operator: operator || "Administrateur",
    data: {
      settings: data.settings || null,
      items: data.items || [],
      movements: data.movements || [],
      customers: data.customers || [],
      suppliers: data.suppliers || [],
      quotes: data.quotes || [],
      invoices: data.invoices || []
    }
  };

  const backupsCol = collection(db, 'backups');
  try {
    const docRef = await addDoc(backupsCol, backupData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'backups');
    throw error;
  }
}

export async function getBackupsFromCloud(): Promise<CloudBackup[]> {
  if (!isFirebaseAvailable || !db) {
    return [];
  }

  try {
    const backupsCol = collection(db, 'backups');
    const q = query(backupsCol, orderBy('createdAt', 'desc'), limit(15));
    const querySnapshot = await getDocs(q);
    
    const backups: CloudBackup[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      backups.push({
        id: doc.id,
        createdAt: docData.createdAt,
        label: docData.label,
        operator: docData.operator,
        data: docData.data
      });
    });
    
    return backups;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'backups');
    throw error;
  }
}

export async function deleteBackupFromCloud(id: string): Promise<void> {
  if (!isFirebaseAvailable || !db) {
    throw new Error("Le service de sauvegarde Cloud n'est pas disponible.");
  }
  
  const path = `backups/${id}`;
  try {
    const docRef = doc(db, 'backups', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
