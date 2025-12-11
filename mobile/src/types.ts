export interface LiftSummary {
  id: number;
  name: string;
  slug: string;
  is_open: boolean;
}

export interface TerrainAreaSummary {
  id: number;
  name: string;
  slug: string;
  status: string;
}

export interface OverviewResponse {
  lifts: LiftSummary[];
  terrain_areas: TerrainAreaSummary[];
}

export interface PreferencesResponse {
  terrain_areas: { id: number; name: string; slug: string }[];
  trails: { id: number; name: string; slug: string; difficulty?: string | null }[];
}

export interface TrailResponse {
  trail: {
    id: number;
    name: string;
    slug: string;
    difficulty: string | null;
    status: string;
    is_groomed: boolean;
    lift: { id: number; name: string; slug: string } | null;
  };
  history: { id: number; old_status: string | null; new_status: string; changed_at: string }[];
}

export interface TerrainAreaResponse {
  terrain_area: { id: number; name: string; slug: string; status: string; notes?: string | null };
  lifts: { id: number; name: string; slug: string }[];
  trails: { id: number; name: string; slug: string }[];
}

