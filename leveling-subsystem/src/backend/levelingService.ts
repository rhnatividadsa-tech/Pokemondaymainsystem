import { supabase } from './supabaseClient';

export interface PlayerRecord {
  player_id: string;
  player_name: string;
  coin_balance: number;
}

export interface PlayerPokemonRecord {
  pokedex_id: string;
  player_id: string;
  pokemon_id: string;
  pokemon_name: string;
  type: string | null;
  region: string | null;
  image: string | null;
  level: number;
  source: string | null;
  status: string | null;
}

export interface SaveLevelingResultInput {
  player_id: string;
  pokedex_id: string;
  pokemon_id: string;
  game_name: string;
  result: string;
  level_gain?: number;
  coins_earned?: number;
  source_system: 'leveling_subsystem';
}

interface PlayerPokedexRow {
  id: string | number;
  player_id: string | number;
  pokemon_id: string | number;
  level: number | null;
  source: string | null;
  status: string | null;
  pokemon:
    | {
        pokemon_name: string;
        type: string | null;
        region: string | null;
        image: string | null;
      }
    | {
        pokemon_name: string;
        type: string | null;
        region: string | null;
        image: string | null;
      }[]
    | null;
}

const OWNED_POKEMON_SOURCES = ['main_system', 'Starter', 'starter'];

function requireText(value: string | undefined, fieldName: string) {
  if (!value || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
}

export async function findPlayerByName(playerName: string): Promise<PlayerRecord> {
  const normalizedName = playerName.trim().replace(/\s+/g, ' ');

  if (!normalizedName) {
    throw new Error('Player name is required.');
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, player_name')
    .ilike('player_name', normalizedName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Player not found. Please register in the Main System first.');
  }

  const { data: gameLogs, error: coinError } = await supabase
    .from('game_logs')
    .select('coins_earned')
    .eq('player_id', data.id);

  if (coinError) {
    throw new Error(coinError.message);
  }

  const coinBalance = (gameLogs ?? []).reduce(
    (total, gameLog) => total + (gameLog.coins_earned ?? 0),
    0,
  );

  return {
    player_id: String(data.id),
    player_name: data.player_name,
    coin_balance: coinBalance,
  };
}

export async function loadPlayerPokemon(playerId: string): Promise<PlayerPokemonRecord[]> {
  requireText(playerId, 'player_id');

  const { data, error } = await supabase
    .from('player_pokemon')
    .select(
      `
        id,
        player_id,
        pokemon_id,
        level,
        source,
        status,
        pokemon!inner (
          pokemon_name,
          type,
          region,
          image
        )
      `,
    )
    .eq('player_id', playerId)
    .ilike('status', 'active')
    .in('source', OWNED_POKEMON_SOURCES)
    .order('id', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlayerPokedexRow[]).map((row) => {
    const pokemonDatabase = Array.isArray(row.pokemon)
      ? row.pokemon[0]
      : row.pokemon;

    return {
      pokedex_id: String(row.id),
      player_id: String(row.player_id),
      pokemon_id: String(row.pokemon_id),
      pokemon_name: pokemonDatabase?.pokemon_name ?? 'Unknown Pokemon',
      type: pokemonDatabase?.type ?? null,
      region: pokemonDatabase?.region ?? null,
      image: pokemonDatabase?.image ?? null,
      level: row.level ?? 0,
      source: row.source,
      status: row.status,
    };
  });
}

export async function saveLevelingResult(input: SaveLevelingResultInput): Promise<string> {
  requireText(input.player_id, 'player_id');
  requireText(input.pokedex_id, 'pokedex_id');
  requireText(input.pokemon_id, 'pokemon_id');
  requireText(input.game_name, 'game_name');
  requireText(input.result, 'result');

  if (input.source_system !== 'leveling_subsystem') {
    throw new Error('source_system must be leveling_subsystem.');
  }

  const levelGain = input.level_gain ?? 0;
  const coinsEarned = input.coins_earned ?? 0;

  if (levelGain < 0) {
    throw new Error('level_gain cannot be negative.');
  }

  if (coinsEarned < 0) {
    throw new Error('coins_earned cannot be negative.');
  }

  const { data: pokedexRow, error: pokedexReadError } = await supabase
    .from('player_pokemon')
    .select('level')
    .eq('id', input.pokedex_id)
    .eq('player_id', input.player_id)
    .eq('pokemon_id', input.pokemon_id)
    .ilike('status', 'active')
    .in('source', OWNED_POKEMON_SOURCES)
    .single();

  if (pokedexReadError) {
    throw new Error(pokedexReadError.message);
  }

  const currentLevel = pokedexRow?.level ?? 0;
  const nextLevel = Math.min(100, currentLevel + levelGain);
  const appliedLevelGain = Math.max(0, nextLevel - currentLevel);

  const { error: pokedexUpdateError, count: updatedPokemonCount } = await supabase
    .from('player_pokemon')
    .update({ level: nextLevel }, { count: 'exact' })
    .eq('id', input.pokedex_id)
    .eq('player_id', input.player_id)
    .eq('pokemon_id', input.pokemon_id)
    .ilike('status', 'active')
    .in('source', OWNED_POKEMON_SOURCES);

  if (pokedexUpdateError) {
    throw new Error(pokedexUpdateError.message);
  }

  if (updatedPokemonCount === 0) {
    throw new Error('Selected Pokemon is not owned by this player.');
  }

  const { error: historyInsertError } = await supabase.from('game_logs').insert({
    player_id: input.player_id,
    pokemon_id: input.pokemon_id,
    game_name: input.game_name,
    result: input.result,
    level_gain: appliedLevelGain,
    coins_earned: coinsEarned,
    source_system: input.source_system,
  });

  if (historyInsertError) {
    throw new Error(historyInsertError.message);
  }

  return 'Result saved successfully.';
}
