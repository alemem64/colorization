"use client";

import { create } from "zustand";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type FileStatus = "pending" | "processing" | "done";

export interface ManagedFile {
  id: string;
  file: File;
  name: string;
  preview: string;
  status: FileStatus;
  order: number;
}

export type Resolution = "1k" | "2k" | "3k" | "4k";
export type SortOrder = "asc" | "desc";
export type ProcessingMode = "colorize" | "translate";

interface AppState {
  // Files
  files: ManagedFile[];
  sortOrder: SortOrder;

  // Settings
  apiKey: string;
  batchSize: number;
  resolution: Resolution;
  fromLanguage: string;
  toLanguage: string;

  // Processing state
  isProcessing: boolean;
  processedCount: number;
  currentMode: ProcessingMode | null;

  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  reorderFiles: (activeId: string, overId: string) => void;
  toggleSortOrder: () => void;
  sortFiles: (order: SortOrder) => void;

  // Settings actions
  setApiKey: (key: string) => void;
  setBatchSize: (size: number) => void;
  setResolution: (res: Resolution) => void;
  setFromLanguage: (lang: string) => void;
  setToLanguage: (lang: string) => void;

  // Processing actions
  startProcessing: (mode: ProcessingMode) => Promise<void>;
  downloadZip: () => Promise<void>;
  resetProcessing: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "png";
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  files: [],
  sortOrder: "asc",
  apiKey: "",
  batchSize: 1,
  resolution: "2k",
  fromLanguage: "",
  toLanguage: "",
  isProcessing: false,
  processedCount: 0,
  currentMode: null,

  // File actions
  addFiles: (newFiles: File[]) => {
    const currentFiles = get().files;
    const startOrder = currentFiles.length;

    const managedFiles: ManagedFile[] = newFiles.map((file, index) => ({
      id: generateId(),
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      status: "pending" as FileStatus,
      order: startOrder + index,
    }));

    set({ files: [...currentFiles, ...managedFiles] });
  },

  removeFile: (id: string) => {
    const files = get().files;
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    const updatedFiles = files
      .filter((f) => f.id !== id)
      .map((f, index) => ({ ...f, order: index }));

    set({ files: updatedFiles });
  },

  clearFiles: () => {
    const files = get().files;
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    set({
      files: [],
      isProcessing: false,
      processedCount: 0,
      currentMode: null,
    });
  },

  reorderFiles: (activeId: string, overId: string) => {
    const files = [...get().files];
    const activeIndex = files.findIndex((f) => f.id === activeId);
    const overIndex = files.findIndex((f) => f.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    const [removed] = files.splice(activeIndex, 1);
    files.splice(overIndex, 0, removed);

    const reorderedFiles = files.map((f, index) => ({ ...f, order: index }));
    set({ files: reorderedFiles });
  },

  toggleSortOrder: () => {
    const newOrder = get().sortOrder === "asc" ? "desc" : "asc";
    get().sortFiles(newOrder);
  },

  sortFiles: (order: SortOrder) => {
    const files = [...get().files];
    files.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return order === "asc" ? comparison : -comparison;
    });

    const sortedFiles = files.map((f, index) => ({ ...f, order: index }));
    set({ files: sortedFiles, sortOrder: order });
  },

  // Settings actions
  setApiKey: (key: string) => set({ apiKey: key }),
  setBatchSize: (size: number) => set({ batchSize: size }),
  setResolution: (res: Resolution) => set({ resolution: res }),
  setFromLanguage: (lang: string) => set({ fromLanguage: lang }),
  setToLanguage: (lang: string) => set({ toLanguage: lang }),

  // Processing actions
  startProcessing: async (mode: ProcessingMode) => {
    const { files, batchSize } = get();
    if (files.length === 0) return;

    set({ isProcessing: true, processedCount: 0, currentMode: mode });

    // Reset all files to pending
    const resetFiles = files.map((f) => ({ ...f, status: "pending" as FileStatus }));
    set({ files: resetFiles });

    // Mock processing - process files in batches
    const totalFiles = files.length;
    const batches = Math.ceil(totalFiles / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalFiles);

      // Mark current batch as processing
      set((state) => ({
        files: state.files.map((f, idx) =>
          idx >= startIdx && idx < endIdx
            ? { ...f, status: "processing" as FileStatus }
            : f
        ),
      }));

      // Simulate processing delay (500ms per batch)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mark batch as done
      set((state) => ({
        files: state.files.map((f, idx) =>
          idx >= startIdx && idx < endIdx
            ? { ...f, status: "done" as FileStatus }
            : f
        ),
        processedCount: endIdx,
      }));
    }

    set({ isProcessing: false });
  },

  downloadZip: async () => {
    const { files } = get();
    if (files.length === 0) return;

    const zip = new JSZip();

    // Add files to zip with renamed filenames based on order
    for (let i = 0; i < files.length; i++) {
      const managedFile = files[i];
      const extension = getFileExtension(managedFile.name);
      const newFilename = `${i + 1}p.${extension}`;

      const arrayBuffer = await managedFile.file.arrayBuffer();
      zip.file(newFilename, arrayBuffer);
    }

    // Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "nano-manana-output.zip");
  },

  resetProcessing: () => {
    set((state) => ({
      files: state.files.map((f) => ({ ...f, status: "pending" as FileStatus })),
      isProcessing: false,
      processedCount: 0,
      currentMode: null,
    }));
  },
}));
