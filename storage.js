import { set as idbSet, get as idbGet, del as idbDel } from "idb-keyval";

const CLIP_KEY = "auto-clip-clips";

// We can't store Blobs directly in IndexedDB reliably across all browsers.
// A common strategy is to store them as ArrayBuffers or, for simplicity here,
// just store metadata and reconstruct what we can on load.
// For this app, we'll store metadata and if we have a blob URL, we can refetch.
export async function saveClips(clips) {
  try {
    const storableClips = clips.map(c => {
      // Create a simplified object for storage.
      // Avoid storing large blobs directly. We will rely on rawBlob reconstruction if needed.
      const storable = {
        id: c.id,
        createdAt: c.createdAt,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.duration,
        selected: c.selected,
        // Don't store blobs, just indicate if they exist.
        hasBlob: !!c.blob,
      };
      return storable;
    });
    await idbSet(CLIP_KEY, storableClips);
  } catch (e) {
    console.error("Failed to save clips to IndexedDB", e);
  }
}

export async function loadClips() {
  try {
    const saved = await idbGet(CLIP_KEY);
    if (Array.isArray(saved)) {
      // When we load, clips won't have their blobs. The user will need
      // to re-compose them if they refresh. This is a limitation of not
      // storing the large blob data. The core clip markers are preserved.
      return saved.map(s => ({
        ...s,
        blob: null,
        rawBlob: null,
        thumb: null, // Thumb will be gone on reload
        composing: false, // Reset composing state
      }));
    }
  } catch (e) {
    console.error("Failed to load clips from IndexedDB", e);
  }
  return [];
}