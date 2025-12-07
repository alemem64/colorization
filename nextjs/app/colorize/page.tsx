"use client";

import { useAppStore } from "@/store/useAppStore";
import { FileUpload } from "@/components/FileUpload";
import { FileGrid } from "@/components/FileGrid";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ColorizePage() {
  const files = useAppStore((state) => state.files);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content area */}
      <div className="flex-1 p-6 overflow-hidden">
        {files.length === 0 ? <FileUpload /> : <FileGrid />}
      </div>

      {/* Sidebar */}
      <Sidebar mode="colorize" />
    </div>
  );
}
