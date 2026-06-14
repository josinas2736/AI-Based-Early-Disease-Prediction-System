/**
 * Patient prediction history stored in localStorage.
 */

import type { PredictionResult } from '@/types/types';

const STORAGE_KEY = 'ai_disease_prediction_history';

export function loadHistory(): PredictionResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PredictionResult[];
  } catch {
    return [];
  }
}

export function saveResult(result: PredictionResult): void {
  const history = loadHistory();
  history.unshift(result); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)));
}

export function deleteResult(id: string): void {
  const history = loadHistory().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
