// IndexedDB-backed prescription blob storage
// Phase 2: swap internals to Supabase Storage — interface unchanged

export interface PrescriptionBlob {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
}

interface StoredBlob extends PrescriptionBlob {
  blob: Blob;
}

const DB_NAME = 'healthrx_prescriptions';
const STORE_NAME = 'uploads';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('patientId', 'patientId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const prescriptionBlobService = {
  async saveBlob(patientId: string, file: File): Promise<{ id: string }> {
    const id = `blob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: StoredBlob = {
      id,
      patientId,
      fileName: file.name,
      fileType: file.type,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      blob: file,
    };
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve({ id });
      tx.onerror = () => reject(tx.error);
    });
  },

  async listBlobs(patientId: string): Promise<PrescriptionBlob[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('patientId');
      const request = index.getAll(patientId);
      request.onsuccess = () => {
        const results: PrescriptionBlob[] = (request.result as StoredBlob[]).map(
          ({ blob: _blob, ...meta }) => meta
        );
        results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getBlob(id: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const record = request.result as StoredBlob | undefined;
        resolve(record?.blob ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async removeBlob(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
