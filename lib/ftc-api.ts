// lib/ftc-api.ts
// FTC API Service with Secure Authentication

const FTC_API_BASE = 'http://localhost:3001/api/v2.0/2025';
const EVENT_CODE = 'CAABCMP';

export interface Team {
  teamNumber: number;
  nameShort: string;
  nameFull: string;
  city?: string;
  stateProv?: string;
  country?: string;
  rookieYear?: number;
}

export interface Ranking {
  rank: number;
  teamNumber: number;
  wins: number;
  losses: number;
  ties: number;
  qualifyingPoints: number;
  rankingPoints: number;
  opr?: number;
  np?: number;
  tbp?: number;
}

export interface TeamWithRanking extends Team {
  ranking?: Ranking;
}

interface ApiCredentials {
  username: string;
  authKey: string;
}

/**
 * Encodes credentials to Base64 for Basic Authentication
 */
export function encodeCredentials(username: string, authKey: string): string {
  const credentials = `${username}:${authKey}`;
  return btoa(credentials);
}

/**
 * Gets API credentials from localStorage
 */
export function getStoredCredentials(): ApiCredentials | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('ftc_api_credentials');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Saves API credentials to localStorage
 */
export function saveCredentials(username: string, authKey: string): void {
  if (typeof window === 'undefined') return;
  
  const credentials: ApiCredentials = { username, authKey };
  localStorage.setItem('ftc_api_credentials', JSON.stringify(credentials));
}

/**
 * Clears stored API credentials
 */
export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ftc_api_credentials');
}

/**
 * Creates authentication headers for API requests
 */
function getAuthHeaders(credentials: ApiCredentials): HeadersInit {
  const encodedAuth = encodeCredentials(credentials.username, credentials.authKey);
  return {
    'Authorization': `Basic ${encodedAuth}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetches teams participating in the event
 */
export async function fetchTeams(eventCode: string = EVENT_CODE): Promise<Team[]> {
  const credentials = getStoredCredentials();
  if (!credentials) {
    throw new Error('API credentials not configured. Please set them in Admin settings.');
  }

  const response = await fetch(
    `${FTC_API_BASE}/teams?eventCode=${eventCode}`,
    {
      headers: getAuthHeaders(credentials),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.teams || [];
}

/**
 * Fetches rankings for the event
 */
export async function fetchRankings(eventCode: string = EVENT_CODE): Promise<Ranking[]> {
  const credentials = getStoredCredentials();
  if (!credentials) {
    throw new Error('API credentials not configured. Please set them in Admin settings.');
  }

  const response = await fetch(
    `${FTC_API_BASE}/rankings/${eventCode}`,
    {
      headers: getAuthHeaders(credentials),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rankings: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.Rankings || [];
}

/**
 * Fetches teams with their rankings merged
 */
export async function fetchTeamsWithRankings(eventCode: string = EVENT_CODE): Promise<TeamWithRanking[]> {
  const [teams, rankings] = await Promise.all([
    fetchTeams(eventCode),
    fetchRankings(eventCode),
  ]);

  const rankingMap = new Map(
    rankings.map(r => [r.teamNumber, r])
  );

  return teams.map(team => ({
    ...team,
    ranking: rankingMap.get(team.teamNumber),
  }));
}

/**
 * Validates API credentials by making a test request
 */
export async function validateCredentials(username: string, authKey: string): Promise<boolean> {
  try {
    const encodedAuth = encodeCredentials(username, authKey);
    const response = await fetch(
      `${FTC_API_BASE}/teams?eventCode=${EVENT_CODE}`,
      {
        headers: {
          'Authorization': `Basic ${encodedAuth}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
