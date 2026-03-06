import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import vm from 'node:vm';
import { slugify } from '@/lib/slug';
import {
  AltaLiftStatus,
  CurrentAccessGate,
  CurrentAltaStatus,
  CurrentLift,
  CurrentTerrainArea,
  CurrentTrail,
} from './types';

type AltaRecord = Record<string, unknown>;

export const ALTA_STATUS_URL = 'https://www.alta.com/lift-terrain-status';

export async function fetchAltaHtml(): Promise<string> {
  const res = await fetch(ALTA_STATUS_URL, {
    headers: {
      'User-Agent': 'AltaEyesBot/1.0 (+https://example.com)',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Alta page: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

export function extractWindowAltaScript(html: string): string {
  const $ = cheerio.load(html);
  const scripts = $('script')
    .map((_, el) => $(el).html() || '')
    .get();

  const match = scripts.find((text) => text && text.includes('window.Alta'));
  if (!match) {
    throw new Error('Could not find window.Alta script block');
  }
  return match;
}

export function parseWindowAlta(script: string): unknown {
  const regex = /window\.Alta\s*=\s*({[\s\S]*?});/m;
  const match = script.match(regex);
  if (!match) {
    throw new Error('Unable to parse window.Alta object');
  }

  const objectLiteral = match[1];
  const sandbox: { window: Record<string, unknown> } = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(`window.Alta = ${objectLiteral};`, sandbox);
  return sandbox.window.Alta;
}

function booleanFromStatus(status?: string): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized.includes('open') && !normalized.includes('closed');
}

function toStringOrNull(value: any): string | null {
  return value == null ? null : typeof value === 'string' ? value : String(value);
}

function normalizeTrail(raw: any, liftId: number, fallbackUpdatedAt: string): CurrentTrail {
  const id = Number(raw.id ?? raw.runId ?? raw.run_id);
  const name = String(raw.name ?? raw.runName ?? raw.run_name ?? 'Unknown').trim();
  const status = String(raw.status ?? raw.statusName ?? raw.status_name ?? 'Unknown').trim();
  const difficulty = String(raw.difficulty ?? raw.difficultyName ?? raw.difficulty_name ?? '').toLowerCase();
  const isGroomed = Boolean(raw.groomed ?? raw.isGroomed ?? status.toLowerCase() === 'groomed');
  const updatedAt = String(raw.updatedAt ?? raw.updated_at ?? fallbackUpdatedAt ?? new Date().toISOString());

  return {
    id,
    liftId,
    name,
    slug: slugify(name),
    difficulty,
    status,
    isOpen: booleanFromStatus(status),
    isGroomed,
    updatedAt,
  };
}

function normalizeLift(raw: any): CurrentLift {
  const id = Number(raw.id ?? raw.liftId ?? raw.lift_id);
  const name = String(raw.name ?? raw.liftName ?? raw.lift_name ?? 'Unknown').trim();
  const status = String(raw.status ?? raw.statusName ?? raw.status_name ?? '').trim();
  const runsRaw = (raw.runs ?? raw.trails ?? []) as AltaRecord[];
  const updatedAt = String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString());

  const runs = runsRaw
    .map((trail) => normalizeTrail(trail, id, updatedAt))
    .filter((t) => Number.isFinite(t.id));

  return {
    id,
    name,
    slug: slugify(name),
    capacity: raw.capacity ? Number(raw.capacity) : raw.capacity === 0 ? 0 : null,
    openingAt: toStringOrNull(raw.openingAt ?? raw.openTime),
    closingAt: toStringOrNull(raw.closingAt ?? raw.closeTime),
    isOpen: booleanFromStatus(status.length ? status : raw.isOpen ? 'open' : ''),
    updatedAt,
    runs,
  };
}

function normalizeTerrainArea(raw: any): CurrentTerrainArea {
  const id = Number(raw.id ?? raw.areaId ?? raw.area_id);
  const name = String(raw.name ?? raw.areaName ?? raw.area_name ?? 'Unknown').trim();
  const status = String(raw.status ?? raw.statusName ?? raw.status_name ?? 'unknown').trim().toLowerCase();
  const updatedAt = String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString());
  return {
    id,
    name,
    slug: slugify(name),
    status,
    notes: toStringOrNull(raw.notes),
    updatedAt,
  };
}

function normalizeAccessGate(raw: any): CurrentAccessGate {
  const id = Number(raw.id ?? raw.gateId ?? raw.gate_id);
  const name = String(raw.name ?? raw.gateName ?? raw.gate_name ?? 'Unknown').trim();
  const status = String(raw.status ?? raw.statusName ?? raw.status_name ?? '').trim();
  const updatedAt = String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString());
  return {
    id,
    name,
    slug: slugify(name),
    isOpen: booleanFromStatus(status.length ? status : raw.isOpen ? 'open' : ''),
    updatedAt,
  };
}

export async function getCurrentAltaStatus(): Promise<CurrentAltaStatus> {
  const html = await fetchAltaHtml();
  const script = extractWindowAltaScript(html);
  const windowAltaRaw = parseWindowAlta(script);
  const windowAlta =
    typeof windowAltaRaw === 'object' && windowAltaRaw !== null
      ? (windowAltaRaw as Record<string, unknown>)
      : {};
  const liftStatusRaw = (windowAlta['liftStatus'] ?? windowAlta['liftstatus']) as unknown;
  const liftStatus = (liftStatusRaw || {}) as AltaLiftStatus;

  const lifts = (liftStatus.lifts ?? []).map(normalizeLift).filter((l) => Number.isFinite(l.id));
  const terrainAreas = (liftStatus.terrainAreas ?? []).map(normalizeTerrainArea).filter((t) => Number.isFinite(t.id));
  const accessGates = (liftStatus.accessGates ?? []).map(normalizeAccessGate).filter((g) => Number.isFinite(g.id));

  return { lifts, terrainAreas, accessGates };
}

