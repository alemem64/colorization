/**
 * Core service for Gemini API interactions
 * Contains shared utilities for both colorize and translate features
 */

import { GoogleGenAI } from "@google/genai";
import { debugLogger } from "./debug";

export type Resolution = "1K" | "2K" | "3K" | "4K";

export interface ProcessingConfig {
  apiKey: string;
  batchSize: number;
  resolution: Resolution;
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string; // base64
  };
}

export interface TextPart {
  text: string;
}

export type ContentPart = ImagePart | TextPart;

export interface ProcessedResult {
  index: number;
  imageData: string; // base64
  mimeType: string;
}

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/xxx;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get MIME type from file
 */
export function getMimeType(file: File): string {
  return file.type || "image/png";
}

/**
 * Create an inline data part for Gemini API
 */
export function createImagePart(base64Data: string, mimeType: string): ImagePart {
  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

/**
 * Create a text part for Gemini API
 */
export function createTextPart(text: string): TextPart {
  return { text };
}

/**
 * Convert resolution string to API format
 */
export function formatResolution(resolution: string): Resolution {
  return resolution.toUpperCase() as Resolution;
}

/**
 * Call Gemini API with image generation capability
 */
export async function callGeminiImageAPI(
  apiKey: string,
  contents: ContentPart[],
  resolution: Resolution,
  requestId: string
): Promise<ProcessedResult[]> {
  const ai = new GoogleGenAI({ apiKey });

  const requestPayload = {
    model: "gemini-3-pro-image-preview",
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"] as const,
      imageConfig: {
        imageSize: resolution,
      },
    },
  };

  // Log request
  debugLogger.logRequest(requestId, requestPayload);

  try {
    const response = await ai.models.generateContent({
      model: requestPayload.model,
      contents: requestPayload.contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Log response
    debugLogger.logResponse(requestId, response as unknown as Record<string, unknown>);

    const results: ProcessedResult[] = [];
    let imageIndex = 0;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          results.push({
            index: imageIndex,
            imageData: part.inlineData.data || "",
            mimeType: part.inlineData.mimeType || "image/png",
          });
          imageIndex++;
        }
      }
    }

    return results;
  } catch (error) {
    debugLogger.logResponse(requestId, { error: String(error) });
    throw error;
  }
}

/**
 * Convert base64 to Blob URL for display
 */
export function base64ToBlob(base64: string, mimeType: string): string {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Convert base64 to File object
 */
export function base64ToFile(base64: string, mimeType: string, filename: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
}
