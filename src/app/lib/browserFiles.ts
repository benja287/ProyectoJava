/**
 * browserFiles.ts
 * Guarda y recupera archivos en IndexedDB.
 * IndexedDB es completamente independiente de localStorage,
 * por lo que nunca puede romper los datos del sistema.
 */

const DB_NAME    = 'congress_files_db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// ── Abrir / crear la base de datos ────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
      }
    };

    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror   = ()  => reject(new Error('No se pudo abrir IndexedDB'));
  });
}

// ── Guardar archivo ───────────────────────────────────────────────────────────
export interface StoredFile {
  fileId:   string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function saveBrowserFile(file: File): Promise<StoredFile> {
  const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Leer el archivo como ArrayBuffer
  const buffer = await file.arrayBuffer();

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record = {
      fileId,
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      fileSize: file.size,
      data:     buffer,
    };

    const req = store.put(record);
    req.onsuccess = () => resolve({ fileId, fileName: file.name, fileType: file.type, fileSize: file.size });
    req.onerror   = () => reject(new Error('No se pudo guardar el archivo'));
  });
}

// ── Recuperar archivo y abrirlo / descargarlo ─────────────────────────────────
export async function openStoredBrowserFile({
  fileId,
  fileName,
  fallbackMimeType = 'application/pdf',
}: {
  fileId?:          string;
  fileName?:        string;
  fallbackMimeType?: string;
}): Promise<void> {
  if (!fileId) {
    alert('No hay archivo disponible para este registro.');
    return;
  }

  const db = await openDB();

  const record: any = await new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(fileId);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(new Error('No se pudo leer el archivo'));
  });

  if (!record) {
    alert('El archivo no está disponible en este navegador. Es posible que haya sido enviado desde otro dispositivo.');
    return;
  }

  const blob = new Blob([record.data], { type: record.fileType || fallbackMimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = record.fileName || fileName || 'archivo.pdf';
  a.target   = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Eliminar archivo ──────────────────────────────────────────────────────────
export async function deleteBrowserFile(fileId?: string): Promise<void> {
  if (!fileId) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject();
    });
  } catch {
    // Si falla el delete no importa, no rompe nada
  }
}

/** Tamaño máximo de archivo para guardar copia en localStorage (base64). Evita quota; el evaluador puede ver el PDF sin compartir IndexedDB con el proponente. */
export const MAX_FILE_BASE64_EMBED_BYTES = 1_800_000;

/** Lee el archivo como base64 (sin prefijo data:) para persistir junto al JSON del congreso. */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    r.onerror = () => reject(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });
}

/** Descarga o abre un PDF desde base64 (útil cuando el archivo viaja en localStorage). */
export function downloadFromBase64(
  base64: string,
  fileName: string,
  mimeType: string = 'application/pdf'
): void {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'archivo.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch {
    alert('No se pudo abrir el archivo adjunto.');
  }
}

/**
 * Preferencia: copia embebida en localStorage (visible para otros roles en el mismo origen),
 * si no hay, IndexedDB en este navegador.
 */
export async function openOrDownloadFile(opts: {
  fileId?: string;
  fileName?: string;
  filePdfBase64?: string;
  fallbackMimeType?: string;
}): Promise<void> {
  const { filePdfBase64, fileId, fileName, fallbackMimeType = 'application/pdf' } = opts;
  if (filePdfBase64) {
    downloadFromBase64(filePdfBase64, fileName || 'documento.pdf', fallbackMimeType);
    return;
  }
  await openStoredBrowserFile({ fileId, fileName, fallbackMimeType });
}

// ── Verificar si un archivo existe ───────────────────────────────────────────
export async function browserFileExists(fileId?: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const db = await openDB();
    const record = await new Promise<any>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(fileId);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject();
    });
    return !!record;
  } catch {
    return false;
  }
}