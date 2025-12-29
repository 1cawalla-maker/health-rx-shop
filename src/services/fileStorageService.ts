// File storage service - mock implementation
// Will be replaced with Supabase Storage

import type { FileUploadResult } from '@/types/services';

const MOCK_FILES_KEY = 'healthrx_mock_files';

interface StoredFile {
  path: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

const getStoredFiles = (): Record<string, StoredFile> => {
  const stored = localStorage.getItem(MOCK_FILES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

const saveStoredFiles = (files: Record<string, StoredFile>): void => {
  localStorage.setItem(MOCK_FILES_KEY, JSON.stringify(files));
};

export const fileStorageService = {
  // Upload a file to storage
  uploadFile: async (
    bucket: string,
    path: string,
    file: File
  ): Promise<FileUploadResult> => {
    // TODO: Replace with Supabase Storage
    // const { error } = await supabase.storage.from(bucket).upload(path, file);
    // if (error) return { success: false, error: error.message };
    // return { success: true, path };

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fullPath = `${bucket}/${path}`;
        const files = getStoredFiles();
        files[fullPath] = {
          path: fullPath,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };
        saveStoredFiles(files);
        resolve({ success: true, path: fullPath });
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file' });
      };
      reader.readAsDataURL(file);
    });
  },

  // Get a download URL for a private file
  getDownloadUrl: async (
    bucket: string,
    path: string
  ): Promise<string | null> => {
    // TODO: Replace with Supabase Storage signed URL
    // const { data, error } = await supabase.storage
    //   .from(bucket)
    //   .createSignedUrl(path, 3600);
    // if (error) return null;
    // return data.signedUrl;

    const fullPath = `${bucket}/${path}`;
    const files = getStoredFiles();
    const file = files[fullPath];
    return file?.dataUrl || null;
  },

  // Delete a file from storage
  deleteFile: async (bucket: string, path: string): Promise<boolean> => {
    // TODO: Replace with Supabase Storage
    // const { error } = await supabase.storage.from(bucket).remove([path]);
    // return !error;

    const fullPath = `${bucket}/${path}`;
    const files = getStoredFiles();
    if (files[fullPath]) {
      delete files[fullPath];
      saveStoredFiles(files);
      return true;
    }
    return false;
  },

  // Check if a file exists
  fileExists: async (bucket: string, path: string): Promise<boolean> => {
    const fullPath = `${bucket}/${path}`;
    const files = getStoredFiles();
    return !!files[fullPath];
  },
};
