// lib/storage.ts
// Local storage utilities for scouting data

export interface ScoutingData {
  teamNumber: number;
  drawingDataURL?: string;
  notes: string;
  lastModified: string;
}

const STORAGE_KEY = 'ftc_scouting_data';

/**
 * Gets all scouting data from localStorage
 */
export function getAllScoutingData(): Record<number, ScoutingData> {
  if (typeof window === 'undefined') return {};
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Gets scouting data for a specific team
 */
export function getTeamScoutingData(teamNumber: number): ScoutingData | null {
  const allData = getAllScoutingData();
  return allData[teamNumber] || null;
}

/**
 * Saves scouting data for a specific team
 */
export function saveTeamScoutingData(data: ScoutingData): void {
  if (typeof window === 'undefined') return;
  
  const allData = getAllScoutingData();
  allData[data.teamNumber] = {
    ...data,
    lastModified: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
}

/**
 * Deletes scouting data for a specific team
 */
export function deleteTeamScoutingData(teamNumber: number): void {
  if (typeof window === 'undefined') return;
  
  const allData = getAllScoutingData();
  delete allData[teamNumber];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
}

/**
 * Exports all scouting data as JSON
 */
export function exportScoutingData(): string {
  const allData = getAllScoutingData();
  return JSON.stringify(allData, null, 2);
}

/**
 * Imports scouting data from JSON
 */
export function importScoutingData(jsonString: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const data = JSON.parse(jsonString);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all scouting data
 */
export function clearAllScoutingData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
