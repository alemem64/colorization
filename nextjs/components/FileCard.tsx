"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ManagedFile } from "@/store/useAppStore";
import { Check, GripVertical } from "lucide-react";
import Image from "next/image";

interface FileCardProps {
  file: ManagedFile;
  index: number;
}

export function FileCard({ file, index }: FileCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  // Use processed image if available and done, otherwise original
  const displayImage = file.status === "done" && file.processedPreview 
    ? file.processedPreview 
    : file.preview;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "border-[var(--hl-bd)] shadow-lg scale-105"
          : "border-sec hover:border-[var(--hl-bd)]"
      }`}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] bg-ter">
        <Image
          src={displayImage}
          alt={file.name}
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          draggable={false}
        />

        {/* Processing overlay with shimmer */}
        {file.status === "processing" && (
          <div className="absolute inset-0 bg-sec/60 shimmer pointer-events-none" />
        )}

        {/* Done overlay - only show check icon briefly, then show the processed image */}
        {file.status === "done" && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-hl shadow-md pointer-events-none">
            <Check className="h-4 w-4 text-hl" />
          </div>
        )}

        {/* Index badge */}
        <div className="absolute top-2 left-2 min-w-[28px] px-2 py-1 rounded-md bg-sec text-pri text-sm font-bold text-center shadow-md pointer-events-none">
          {index + 1}
        </div>

        {/* Drag indicator - only show when not done */}
        {file.status !== "done" && (
          <div className="absolute top-2 right-2 p-1.5 rounded-md bg-sec shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <GripVertical className="h-4 w-4 text-sec" />
          </div>
        )}
      </div>

      {/* Filename */}
      <div className="px-3 py-2 bg-sec">
        <p className="text-sm text-sec truncate" title={file.name}>
          {file.name}
        </p>
      </div>
    </div>
  );
}
