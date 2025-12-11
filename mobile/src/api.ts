import { OverviewResponse, PreferencesResponse, TerrainAreaResponse, TrailResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const DEMO_USER_ID =
  process.env.EXPO_PUBLIC_DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': DEMO_USER_ID,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const getOverview = () => apiFetch<OverviewResponse>('/api/status/overview');
export const getTerrainArea = (slug: string) =>
  apiFetch<TerrainAreaResponse>(`/api/terrain-areas/${slug}`);
export const getTrail = (slug: string) => apiFetch<TrailResponse>(`/api/trails/${slug}`);
export const getPreferences = () => apiFetch<PreferencesResponse>('/api/me/preferences');

export const setTerrainPreference = (id: number, notifyEnabled: boolean) =>
  apiFetch(`/api/me/preferences/terrain-areas/${id}`, {
    method: 'POST',
    body: JSON.stringify({ notify_enabled: notifyEnabled }),
  });

export const setTrailPreference = (id: number, notifyEnabled: boolean) =>
  apiFetch(`/api/me/preferences/trails/${id}`, {
    method: 'POST',
    body: JSON.stringify({ notify_enabled: notifyEnabled }),
  });

