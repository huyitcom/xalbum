import { openDB, STORE_IMAGES } from './db';

export interface OptimizedImage {
  id: string;
  originalUrl: string;
  previewUrl: string;
  thumbnailUrl: string;
  status: 'processing' | 'ready';
  progress: number;
}

type Subscriber = () => void;

class ImageOptimizerService {
  private registry = new Map<string, OptimizedImage>();
  private queue: { id: string; file: File }[] = [];
  private isProcessing = false;
  private subscribers = new Set<Subscriber>();
  public isAdding = false;
  private dbLoaded = false;

  public get isLoaded(): boolean {
    return this.dbLoaded;
  }

  constructor() {
    this.loadFromDB();
  }

  private async loadFromDB() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.getAll();
      req.onsuccess = () => {
        const stored = req.result as OptimizedImage[];
        if (stored && Array.isArray(stored)) {
          stored.forEach((img) => {
            if (!this.registry.has(img.id)) {
              this.registry.set(img.id, {
                ...img,
                status: 'ready',
                progress: 100,
              });
            }
          });
          this.dbLoaded = true;
          this.notify();
        }
      };
    } catch (err) {
      console.warn('Could not load cached images from IndexedDB:', err);
    }
  }

  private async persistImage(img: OptimizedImage): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      store.put(img);
    } catch (err) {
      console.warn('Could not persist image to IndexedDB:', err);
    }
  }

  private async deleteFromDB(id: string): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      store.delete(id);
    } catch (err) {
      console.warn('Could not delete image from IndexedDB:', err);
    }
  }

  subscribe(callback: Subscriber) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  getImages() {
    return Array.from(this.registry.values());
  }

  getImage(id: string) {
    return this.registry.get(id);
  }

  async removeImage(id: string) {
    const img = this.registry.get(id);
    if (img) {
      if (img.originalUrl.startsWith('blob:')) URL.revokeObjectURL(img.originalUrl);
      if (img.previewUrl.startsWith('blob:') && img.previewUrl !== img.originalUrl) URL.revokeObjectURL(img.previewUrl);
      if (img.thumbnailUrl.startsWith('blob:') && img.thumbnailUrl !== img.originalUrl) URL.revokeObjectURL(img.thumbnailUrl);
      this.registry.delete(id);
      await this.deleteFromDB(id);
      this.notify();
    }
  }

  async clearAllImages(): Promise<void> {
    this.registry.forEach((img) => {
      if (img.originalUrl?.startsWith('blob:')) URL.revokeObjectURL(img.originalUrl);
      if (img.previewUrl?.startsWith('blob:') && img.previewUrl !== img.originalUrl) URL.revokeObjectURL(img.previewUrl);
      if (img.thumbnailUrl?.startsWith('blob:') && img.thumbnailUrl !== img.originalUrl) URL.revokeObjectURL(img.thumbnailUrl);
    });
    this.registry.clear();
    this.queue = [];
    this.isProcessing = false;
    this.isAdding = false;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      store.clear();
    } catch (err) {
      console.warn('Could not clear IndexedDB image store:', err);
    }
    this.notify();
  }

  /**
   * Restore images (e.g. when importing an .xalbum project file)
   */
  async restoreImages(images: OptimizedImage[]): Promise<void> {
    if (!images || images.length === 0) return;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);

      images.forEach((img) => {
        const item: OptimizedImage = {
          id: img.id,
          originalUrl: img.originalUrl,
          previewUrl: img.previewUrl || img.originalUrl,
          thumbnailUrl: img.thumbnailUrl || img.originalUrl,
          status: 'ready',
          progress: 100,
        };
        this.registry.set(img.id, item);
        store.put(item);
      });

      this.notify();
    } catch (err) {
      console.warn('Error restoring images to IndexedDB:', err);
      // Fallback in-memory
      images.forEach((img) => {
        this.registry.set(img.id, {
          ...img,
          status: 'ready',
          progress: 100,
        });
      });
      this.notify();
    }
  }

  async addImages(files: File[]) {
    this.isAdding = true;
    this.notify();

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const id = 'img_' + Math.random().toString(36).substring(2, 11);

      // Read original as data URL for safe html-to-image embedding
      const originalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(URL.createObjectURL(file));
        reader.readAsDataURL(file);
      });

      const entry: OptimizedImage = {
        id,
        originalUrl,
        previewUrl: originalUrl, // Temporary fallback
        thumbnailUrl: originalUrl, // Temporary fallback
        status: 'processing',
        progress: 0,
      };

      this.registry.set(id, entry);
      this.persistImage(entry);

      this.queue.push({ id, file });
      this.notify(); // Notify incrementally so UI updates progress
    }
    this.isAdding = false;
    this.notify();
    this.processQueue();
  }

  get queueLength() {
    return this.queue.length;
  }

  get processingCount() {
    return Array.from(this.registry.values()).filter((img) => img.status === 'processing').length;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { id, file } = this.queue.shift()!;

      try {
        const imgEntry = this.registry.get(id);
        if (!imgEntry) continue;

        // Step 1: Generate Thumbnail (~240px)
        const thumbnailUrl = await this.resizeImage(file, 240, 0.7);
        imgEntry.thumbnailUrl = thumbnailUrl;
        imgEntry.progress = 50;
        this.notify();

        // Step 2: Generate Preview (~1800px)
        const previewUrl = await this.resizeImage(file, 1800, 0.85);
        imgEntry.previewUrl = previewUrl;
        imgEntry.status = 'ready';
        imgEntry.progress = 100;
        this.persistImage(imgEntry);
        this.notify();
      } catch (err) {
        console.error('Failed to process image:', id, err);
        const imgEntry = this.registry.get(id);
        if (imgEntry) {
          imgEntry.status = 'ready'; // fallback to original
          this.persistImage(imgEntry);
          this.notify();
        }
      }

      // Small yield to not block UI
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
  }

  private resizeImage(file: File, maxDim: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objUrl);

        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(URL.createObjectURL(file)); // fallback
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(URL.createObjectURL(file)); // fallback
              reader.readAsDataURL(blob);
            } else {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(URL.createObjectURL(file)); // fallback
              reader.readAsDataURL(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(URL.createObjectURL(file)); // Fallback to original if load fails
      };

      img.src = objUrl;
    });
  }
}

export const imageOptimizer = new ImageOptimizerService();
