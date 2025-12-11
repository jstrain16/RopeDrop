export interface AltaLift {
  id: number;
  name: string;
  capacity?: number;
  openingAt?: string;
  closingAt?: string;
  status?: string;
  isOpen?: boolean;
  updatedAt?: string;
  runs?: AltaRun[];
}

export interface AltaRun {
  id: number;
  liftId?: number;
  name: string;
  difficulty?: string;
  status?: string;
  groomed?: boolean;
  updatedAt?: string;
}

export interface AltaTerrainArea {
  id: number;
  name: string;
  status?: string;
  notes?: string | null;
  updatedAt?: string;
}

export interface AltaAccessGate {
  id: number;
  name: string;
  status?: string;
  isOpen?: boolean;
  updatedAt?: string;
}

export interface AltaLiftStatus {
  lifts: AltaLift[];
  accessGates: AltaAccessGate[];
  terrainAreas: AltaTerrainArea[];
}

export interface CurrentTrail {
  id: number;
  liftId: number;
  name: string;
  slug: string;
  difficulty: string;
  status: string;
  isOpen: boolean;
  isGroomed: boolean;
  updatedAt: string;
}

export interface CurrentLift {
  id: number;
  name: string;
  slug: string;
  capacity: number | null;
  openingAt: string | null;
  closingAt: string | null;
  isOpen: boolean;
  updatedAt: string;
  runs: CurrentTrail[];
}

export interface CurrentTerrainArea {
  id: number;
  name: string;
  slug: string;
  status: string;
  notes: string | null;
  updatedAt: string;
}

export interface CurrentAccessGate {
  id: number;
  name: string;
  slug: string;
  isOpen: boolean;
  updatedAt: string;
}

export interface CurrentAltaStatus {
  lifts: CurrentLift[];
  terrainAreas: CurrentTerrainArea[];
  accessGates: CurrentAccessGate[];
}

