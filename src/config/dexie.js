import Dexie from 'dexie';

export const db = new Dexie('CondominioEncomendas');

// Define schema
db.version(1).stores({
  photos: 'id, packageId, timestamp, blob',
  pendingSync: '++id, type, data, timestamp'
});

/**
 * Save photo to IndexedDB
 * @param {Blob} blob - Image blob
 * @param {string} packageId - Package ID reference
 * @returns {Promise<string>} Photo ID
 */
export const savePhoto = async (blob, packageId = null) => {
  const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.photos.add({
    id,
    packageId,
    timestamp: new Date(),
    blob
  });
  
  return id;
};

/**
 * Get photo from IndexedDB
 * @param {string} photoId - Photo ID
 * @returns {Promise<Blob|null>}
 */
export const getPhoto = async (photoId) => {
  const photo = await db.photos.get(photoId);
  return photo ? photo.blob : null;
};

/**
 * Delete photo from IndexedDB
 * @param {string} photoId - Photo ID
 */
export const deletePhoto = async (photoId) => {
  await db.photos.delete(photoId);
};

/**
 * Convert Blob to File for Web Share API
 * @param {Blob} blob - Image blob
 * @param {string} fileName - File name
 * @returns {File}
 */
export const blobToFile = (blob, fileName = 'encomenda.jpg') => {
  return new File([blob], fileName, { type: blob.type });
};

/**
 * Add item to sync queue
 * @param {string} type - Type of sync (package, pickup, etc)
 * @param {object} data - Data to sync
 */
export const addToSyncQueue = async (type, data) => {
  await db.pendingSync.add({
    type,
    data,
    timestamp: new Date()
  });
};

/**
 * Get all pending sync items
 * @returns {Promise<Array>}
 */
export const getPendingSync = async () => {
  return await db.pendingSync.toArray();
};

/**
 * Clear sync item after successful sync
 * @param {number} id - Sync item ID
 */
export const clearSyncItem = async (id) => {
  await db.pendingSync.delete(id);
};

export default db;
