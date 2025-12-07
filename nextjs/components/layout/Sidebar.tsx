"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { useAppStore, ProcessingMode, Resolution } from "@/store/useAppStore";
import { Eye, EyeOff, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  mode: ProcessingMode;
}

export function Sidebar({ mode }: SidebarProps) {
  const t = useTranslation();
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    files,
    apiKey,
    batchSize,
    resolution,
    fromLanguage,
    toLanguage,
    isProcessing,
    processedCount,
    error,
    setApiKey,
    setBatchSize,
    setResolution,
    setFromLanguage,
    setToLanguage,
    startProcessing,
    downloadZip,
    clearFiles,
  } = useAppStore();

  const maxBatchSize = mode === "colorize" ? 5 : 16;
  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const progress = files.length > 0 ? (processedCount / files.length) * 100 : 0;

  const handleAction = async () => {
    if (allDone) {
      await downloadZip();
    } else {
      await startProcessing(mode);
    }
  };

  const getButtonText = () => {
    if (allDone) return t.actions.download;
    if (isProcessing) return t.actions.processing;
    return mode === "colorize" ? t.actions.colorize : t.actions.translate;
  };

  // Validation
  const canProcess = apiKey.trim() !== "" && 
    (mode === "colorize" || (fromLanguage.trim() !== "" && toLanguage.trim() !== ""));

  return (
    <aside className="w-80 bg-sec border-l border-sec p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-pri mb-6 capitalize">
        {mode === "colorize" ? t.nav.colorize : t.nav.translate}
      </h2>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* API Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-sec">
            {t.sidebar.apiKey} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t.sidebar.apiKeyPlaceholder}
              className="w-full px-3 py-2 pr-10 rounded-md border border-sec bg-pri text-pri placeholder:text-ter focus:outline-none focus:ring-2 focus:ring-[var(--hl-bd)]"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ter hover:text-sec"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Batch Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-sec">
            {t.sidebar.batchSize}: {batchSize}
          </label>
          <input
            type="range"
            min={1}
            max={maxBatchSize}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-ter accent-[var(--hl-bd)]"
          />
          <div className="flex justify-between text-xs text-ter">
            <span>1</span>
            <span>{maxBatchSize}</span>
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-sec">
            {t.sidebar.resolution}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["1k", "2k", "3k", "4k"] as Resolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  resolution === res
                    ? "bg-hl text-hl"
                    : "bg-ter text-sec hover:bg-pri"
                }`}
              >
                {t.resolutions[res]}
              </button>
            ))}
          </div>
        </div>

        {/* Language inputs (translate only) */}
        {mode === "translate" && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sec">
                {t.sidebar.fromLanguage} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fromLanguage}
                onChange={(e) => setFromLanguage(e.target.value)}
                placeholder={t.sidebar.fromPlaceholder}
                className="w-full px-3 py-2 rounded-md border border-sec bg-pri text-pri placeholder:text-ter focus:outline-none focus:ring-2 focus:ring-[var(--hl-bd)]"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sec">
                {t.sidebar.toLanguage} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={toLanguage}
                onChange={(e) => setToLanguage(e.target.value)}
                placeholder={t.sidebar.toPlaceholder}
                className="w-full px-3 py-2 rounded-md border border-sec bg-pri text-pri placeholder:text-ter focus:outline-none focus:ring-2 focus:ring-[var(--hl-bd)]"
              />
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-y-3">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {/* Progress bar */}
        {isProcessing && (
          <div className="w-full bg-ter rounded-full h-2 overflow-hidden">
            <div
              className="bg-hl h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "var(--hl-bd)" }}
            />
          </div>
        )}

        {/* Main action button */}
        <button
          onClick={handleAction}
          disabled={files.length === 0 || isProcessing || (!allDone && !canProcess)}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            files.length === 0 || isProcessing || (!allDone && !canProcess)
              ? "bg-ter text-ter cursor-not-allowed"
              : allDone
              ? "bg-hl text-hl hover:opacity-90"
              : "bg-hl text-hl hover:opacity-90"
          }`}
          style={{
            backgroundColor: files.length === 0 || isProcessing || (!allDone && !canProcess) ? undefined : "var(--hl-bd)",
          }}
        >
          {getButtonText()}
        </button>

        {/* Clear button */}
        {files.length > 0 && (
          <button
            onClick={clearFiles}
            disabled={isProcessing}
            className="w-full py-2 px-4 rounded-md font-medium text-sec bg-ter hover:bg-sec transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            {t.actions.clear}
          </button>
        )}
      </div>
    </aside>
  );
}
