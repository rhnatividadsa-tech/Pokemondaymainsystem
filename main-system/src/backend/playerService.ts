import { supabase } from './supabaseClient';
import { PlayerPokemonRow, PlayerRow, WalletRow, toPokemonDbId, toPokemonDataId } from './types';

/**
 * Compatibility service for the current frontend App.tsx.
 *
 * The frontend still expects older field names like player_id, player_name,
 * coin_balance, pokedex_id, and pokemon_id. This file keeps that shape while
 * querying the updated Supabase tables:
 * players, wallets, player_pokemon.
 */

type FrontendPlayer = {
  player_id: string;
  player_name: string;
  coin_balance: number;
  starter_pokemon_id: string | null;
};

type FrontendPokedexRow = {
  pokedex_id: string;
  player_id: string;
  pokemon_id: string;
  level: number;
  source: string;
  status: string;
};

function mapFrontendPlayer(player: PlayerRow, wallet?: WalletRow | null): FrontendPlayer {
  return {
    player_id: player.id,
    player_name: player.player_name,
    coin_balance: wallet?.coin_balance ?? 0,
    starter_pokemon_id: toPokemonDataId(player.pokedex_id) ?? null,
  };
}

function mapFrontendPokedex(row: PlayerPokemonRow): FrontendPokedexRow {
  return {
    pokedex_id: row.id,
    player_id: row.player_id,
    pokemon_id: toPokemonDataId(row.pokedex_id) ?? String(row.pokedex_id),
    level: row.level,
    source: row.source,
    status: row.status,
  };
}

async function getWallet(playerId: string): Promise<WalletRow | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select()
    .eq('player_id', playerId)
    .maybeSingle<WalletRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureWallet(playerId: string): Promise<WalletRow> {
  const existing = await getWallet(playerId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('wallets')
    .insert({ player_id: playerId, coin_balance: 0 })
    .select()
    .single<WalletRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function findOrCreatePlayer(playerName: string): Promise<FrontendPlayer> {
  const cleanName = playerName.trim();
  if (!cleanName) {
    throw new Error('Player name is required.');
  }

  const { data: existingPlayer, error: findError } = await supabase
    .from('players')
    .select()
    .ilike('player_name', cleanName)
    .maybeSingle<PlayerRow>();

  if (findError) {
    throw findError;
  }

  if (existingPlayer) {
    const wallet = await ensureWallet(existingPlayer.id);
    return mapFrontendPlayer(existingPlayer, wallet);
  }

  const { data: newPlayer, error: createError } = await supabase
    .from('players')
    .insert({ player_name: cleanName })
    .select()
    .single<PlayerRow>();

  if (createError) {
    throw createError;
  }

  const wallet = await ensureWallet(newPlayer.id);
  return mapFrontendPlayer(newPlayer, wallet);
}

export async function getPlayerDashboardStats(playerId: string) {
  const { data: pokedex, error } = await supabase
    .from('player_pokemon')
    .select()
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  const mappedPokedex = (pokedex ?? []).map(mapFrontendPokedex);
  const totalPokemonCaught = mappedPokedex.length;
  const totalLevelPoints = mappedPokedex.reduce((sum, pokemon) => sum + (pokemon.level ?? 0), 0);

  return {
    pokedex: mappedPokedex,
    totalPokemonCaught,
    totalLevelPoints,
  };
}

export async function ensurePokemonInDb(pokedexIdNum: number) {
  const { data: existing, error: findError } = await supabase
    .from('pokemon')
    .select('pokedex_id')
    .eq('pokedex_id', pokedexIdNum)
    .maybeSingle();
    
  if (findError) throw findError;
  if (existing) return;

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokedexIdNum}`);
  if (!response.ok) throw new Error(`Failed to fetch pokemon ${pokedexIdNum} from PokeAPI`);
  const data = await response.json();
  
  const typeName = data.types[0].type.name;
  const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
  const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  
  let region = 'Unknown';
  if (pokedexIdNum <= 151) region = 'Kanto';
  else if (pokedexIdNum <= 251) region = 'Johto';
  else if (pokedexIdNum <= 386) region = 'Hoenn';
  else if (pokedexIdNum <= 493) region = 'Sinnoh';
  else if (pokedexIdNum <= 649) region = 'Unova';
  else if (pokedexIdNum <= 721) region = 'Kalos';
  else if (pokedexIdNum <= 809) region = 'Alola';
  else if (pokedexIdNum <= 898) region = 'Galar';
  else region = 'Paldea';

  const { error: insertError } = await supabase
    .from('pokemon')
    .insert({
      pokedex_id: pokedexIdNum,
      pokemon_name: capitalizedName,
      type: capitalizedType,
      region: region,
      image: data.sprites?.front_default ?? null,
      evolution_stage: 1,
      evolves_to: null,
      required_stone: null,
    });
    
  if (insertError) {
    throw new Error(`Failed to insert pokemon ${pokedexIdNum} into DB: ${insertError.message}`);
  }
}

export async function saveStarterPokemon(playerId: string, pokemonId: string | number): Promise<FrontendPokedexRow> {
  const pokedexIdNum = typeof pokemonId === 'number' ? pokemonId : parseInt(pokemonId, 10);

  await ensurePokemonInDb(pokedexIdNum);

  const { error: updateError } = await supabase
    .from('players')
    .update({ pokedex_id: pokedexIdNum })
    .eq('id', playerId);

  if (updateError) {
    throw updateError;
  }

  const { data: starterRecord, error: insertError } = await supabase
    .from('player_pokemon')
    .insert({
      player_id: playerId,
      pokedex_id: pokedexIdNum,
      level: 5,
      source: 'Starter',
      status: 'Active',
    })
    .select()
    .single<PlayerPokemonRow>();

  if (insertError) {
    throw insertError;
  }

  return mapFrontendPokedex(starterRecord);
}

