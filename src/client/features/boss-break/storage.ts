/** Keep personal media in this browser, never in the repository or on a third-party host. */
export async function mediaFile(file?: File): Promise<File | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('agent-office-boss-break', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('media');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('media', file ? 'readwrite' : 'readonly');
      const store = tx.objectStore('media');
      const request = file ? store.put(file, 'intro') : store.get('intro');
      let saved: File | undefined;
      request.onsuccess = () => { saved = file ?? request.result; };
      tx.oncomplete = () => { db.close(); resolve(saved); };
      tx.onabort = () => { db.close(); reject(tx.error); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}
