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
  pokedex_id: string;
  player_id: string;
  pokemon_id: string;
  level: number | null;
  source: string | null;
  status: string | null;
  pokemon_database:
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
    .select('player_id, player_name, coin_balance')
    .ilike('player_name', normalizedName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Player not found. Please register in the Main System first.');
  }

  return {
    player_id: data.player_id,
    player_name: data.player_name,
    coin_balance: data.coin_balance ?? 0,
  };
}

export async function loadPlayerPokemon(playerId: string): Promise<PlayerPokemonRecord[]> {
  requireText(playerId, 'player_id');

  const { data, error } = await supabase
    .from('player_pokedex')
    .select(
      `
        pokedex_id,
        player_id,
        pokemon_id,
        level,
        source,
        status,
        pokemon_database (
          pokemon_name,
          type,
          region,
          image
        )
      `,
    )
    .eq('player_id', playerId)
    .order('pokedex_id', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlayerPokedexRow[]).map((row) => {
    const pokemonDatabase = Array.isArray(row.pokemon_database)
      ? row.pokemon_database[0]
      : row.pokemon_database;

    return {
      pokedex_id: row.pokedex_id,
      player_id: row.player_id,
      pokemon_id: row.pokemon_id,
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
    .from('player_pokedex')
    .select('level')
    .eq('pokedex_id', input.pokedex_id)
    .eq('player_id', input.player_id)
    .eq('pokemon_id', input.pokemon_id)
    .single();

  if (pokedexReadError) {
    throw new Error(pokedexReadError.message);
  }

  const currentLevel = pokedexRow?.level ?? 0;
  const nextLevel = Math.min(100, currentLevel + levelGain);
  const appliedLevelGain = Math.max(0, nextLevel - currentLevel);

  const { error: pokedexUpdateError } = await supabase
    .from('player_pokedex')
    .update({ level: nextLevel })
    .eq('pokedex_id', input.pokedex_id);

  if (pokedexUpdateError) {
    throw new Error(pokedexUpdateError.message);
  }

  const { data: playerRow, error: playerReadError } = await supabase
    .from('players')
    .select('coin_balance')
    .eq('player_id', input.player_id)
    .single();

  if (playerReadError) {
    throw new Error(playerReadError.message);
  }

  const currentCoinBalance = playerRow?.coin_balance ?? 0;

  const { error: playerUpdateError } = await supabase
    .from('players')
    .update({ coin_balance: currentCoinBalance + coinsEarned })
    .eq('player_id', input.player_id);

  if (playerUpdateError) {
    throw new Error(playerUpdateError.message);
  }

  const { error: historyInsertError } = await supabase.from('game_history').insert({
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
