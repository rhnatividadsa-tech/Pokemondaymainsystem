/**
 * Database row types mirror docs/database-schema.sql exactly.
 * These stay snake_case because they represent Supabase table columns.
 */
export interface PlayerRow {
  id: string;
  name: string;
  section: string | null;
  assigned_journey: string | null;
  starter_pokemon_id: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
}

export interface OwnedPokemonRow {
  id: string;
  player_id: string;
  pokemon_data_id: string;
  level: number;
  source: PokemonSource;
  status: PokemonStatus;
  caught_at: string;
  updated_at: string;
}

export interface InventoryItemRow {
  id: string;
  player_id: string;
  item_name: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface GameHistoryRow {
  id: string;
  player_id: string;
  pokemon_id: string | null;
  game_name: string;
  result: string;
  level_gain: number;
  coins_earned: number;
  source_system: string;
  notes: string | null;
  created_at: string;
}

/**
 * App-facing types use camelCase so frontend code does not need to know the
 * database column naming style.
 */
export interface Player {
  id: string;
  name: string;
  section?: string;
  assignedJourney?: string;
  starterPokemonId?: string;
  coins: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnedPokemon {
  id: string;
  playerId: string;
  pokemonDataId: string;
  level: number;
  source: PokemonSource;
  status: PokemonStatus;
  caughtAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  playerId: string;
  itemName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameHistoryEntry {
  id: string;
  playerId: string;
  pokemonId?: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
  notes?: string;
  createdAt: string;
}

export type PokemonSource = 'Starter' | 'PokeReflex' | 'PokeGuess' | 'IRL Catch' | 'Manual Log';
export type PokemonStatus = 'Active' | 'Inactive';

export interface HistoryLogInput {
  playerId: string;
  pokemonId?: string | null;
  gameName: string;
  result: string;
  levelGain?: number;
  coinsEarned?: number;
  sourceSystem: string;
  notes?: string | null;
}

export interface SubsystemResult {
  playerName: string;
  pokemonName?: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
}

export interface ManualLogInput {
  playerId: string;
  ownedPokemonId?: string | null;
  pokemonDataId?: string | null;
  levelGain: number;
  coinsEarned: number;
  gameName: string;
  result: string;
  sourceSystem?: string;
  notes?: string;
  addNewPokemon?: boolean;
}

export interface ServiceResult<T> {
  data: T;
  message: string;
}

export function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    section: row.section ?? undefined,
    assignedJourney: row.assigned_journey ?? undefined,
    starterPokemonId: row.starter_pokemon_id ?? undefined,
    coins: row.coins,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOwnedPokemon(row: OwnedPokemonRow): OwnedPokemon {
  return {
    id: row.id,
    playerId: row.player_id,
    pokemonDataId: row.pokemon_data_id,
    level: row.level,
    source: row.source,
    status: row.status,
    caughtAt: row.caught_at,
    updatedAt: row.updated_at,
  };
}

export function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    playerId: row.player_id,
    itemName: row.item_name,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapHistoryEntry(row: GameHistoryRow): GameHistoryEntry {
  return {
    id: row.id,
    playerId: row.player_id,
    pokemonId: row.pokemon_id ?? undefined,
    gameName: row.game_name,
    result: row.result,
    levelGain: row.level_gain,
    coinsEarned: row.coins_earned,
    sourceSystem: row.source_system,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.trunc(level)));
}

export function clampCoins(coins: number): number {
  return Math.max(0, Math.trunc(coins));
}

