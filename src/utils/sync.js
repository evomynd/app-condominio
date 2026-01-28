import { addDoc, collection, writeBatch, doc } from 'firebase/firestore';
import { db as firestore } from '../config/firebase';
import { getPendingSync, clearSyncItem } from '../config/dexie';

/**
 * Check if device is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Sync pending items to Firestore
 */
export const syncPendingItems = async () => {
  if (!isOnline()) {
    console.log('Device is offline, skipping sync');
    return { success: false, message: 'Offline' };
  }

  try {
    const pendingItems = await getPendingSync();
    
    if (pendingItems.length === 0) {
      return { success: true, message: 'Nothing to sync' };
    }

    const batch = writeBatch(firestore);
    const processedIds = [];

    for (const item of pendingItems) {
      try {
        switch (item.type) {
          case 'package':
            await addDoc(collection(firestore, 'packages'), item.data);
            processedIds.push(item.id);
            break;
          
          case 'pickup':
            const pkgRef = doc(firestore, 'packages', item.data.packageId);
            batch.update(pkgRef, item.data.updates);
            processedIds.push(item.id);
            break;
          
          default:
            console.warn('Unknown sync type:', item.type);
        }
      } catch (error) {
        console.error('Error syncing item:', item, error);
      }
    }

    // Commit batch operations
    await batch.commit();

    // Clear synced items
    for (const id of processedIds) {
      await clearSyncItem(id);
    }

    return { 
      success: true, 
      message: `Synced ${processedIds.length} items` 
    };
  } catch (error) {
    console.error('Sync error:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

/**
 * Setup auto-sync on network reconnection
 */
export const setupAutoSync = () => {
  window.addEventListener('online', async () => {
    console.log('Network reconnected, syncing...');
    const result = await syncPendingItems();
    console.log('Sync result:', result);
  });

  window.addEventListener('offline', () => {
    console.log('Network disconnected, entering offline mode');
  });
};
