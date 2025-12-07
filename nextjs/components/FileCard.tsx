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
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
        isDragging
          ? "border-[var(--hl-bd)] shadow-lg scale-105"
          : "border-sec hover:border-[var(--hl-bd)]"
      }`}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] bg-ter">
        <Image
          src={file.preview}
          alt={file.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Processing overlay with shimmer */}
        {file.status === "processing" && (
          <div className="absolute inset-0 bg-sec/60 shimmer" />
        )}

        {/* Done overlay */}
        {file.status === "done" && (
          <div className="absolute inset-0 bg-hl/40 flex items-center justify-center">
            <div className="p-3 rounded-full bg-hl">
              <Check className="h-8 w-8 text-hl" />
            </div>
          </div>
        )}

        {/* Index badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-pri/90 text-pri text-sm font-bold">
          {index + 1}
        </div>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-pri/90 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-sec" />
        </div>
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
