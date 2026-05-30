import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import {
  clampLevel,
  mapOwnedPokemon,
  OwnedPokemon,
  PlayerPokemonRow,
  PokemonSource,
  toPokemonDbId,
} from '../types';

/**
 * Adds a newly caught Pokemon to player_pokemon and logs the catch.
 */
export async function addCaughtPokemon(
  playerId: string,
  pokemonDataId: string | number,
  source: PokemonSource = 'Manual Log',
  coinsEarned = 0,
  gameName = 'Pokemon Catch',
  notes?: string,
  sourceSystem = source === 'Manual Log' ? 'facilitator' : source,
): Promise<OwnedPokemon> {
  const pokemonId = toPokemonDbId(pokemonDataId);

  const { data, error } = await supabase
    .from('player_pokemon')
    .insert({
      player_id: playerId,
      pokemon_id: pokemonId,
      level: 5,
      source,
      status: 'Active',
    })
    .select()
    .single<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to add caught Pokemon: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId,
    gameName,
    result: 'caught',
    coinsEarned,
    sourceSystem,
    loggedBy: notes ?? sourceSystem,
  });

  return mapOwnedPokemon(data);
}

/**
 * Increases a Pokemon level but never beyond level 100.
 */
export async function updatePokemonLevel(
  playerId: string,
  ownedPokemonId: string,
  levelGain: number,
  coinsEarned = 0,
  gameName = 'Level Update',
  result = 'level gained',
  sourceSystem = 'main_system',
  notes?: string,
): Promise<OwnedPokemon> {
  const { data: currentRow, error: fetchError } = await supabase
    .from('player_pokemon')
    .select()
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .single<PlayerPokemonRow>();

  if (fetchError) {
    throw new Error(`Failed to load Pokemon level: ${fetchError.message}`);
  }

  const safeLevelGain = Math.max(0, Math.trunc(levelGain));
  const nextLevel = clampLevel(currentRow.level + safeLevelGain);

  const { data, error } = await supabase
    .from('player_pokemon')
    .update({ level: nextLevel })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .select()
    .single<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to update Pokemon level: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: data.pokemon_id,
    gameName,
    result,
    levelGain: nextLevel - currentRow.level,
    coinsEarned,
    sourceSystem,
    loggedBy: notes ?? sourceSystem,
  });

  return mapOwnedPokemon(data);
}

/**
 * Evolves an owned Pokemon after inventory service has confirmed/consumed the
 * required stone. This function only changes player_pokemon and logs evolution.
 */
export async function evolvePokemon(
  playerId: string,
  ownedPokemonId: string,
  newPokemonDataId: string | number,
  stoneName: string,
  sourceSystem = 'main_system',
): Promise<OwnedPokemon> {
  const newPokemonId = toPokemonDbId(newPokemonDataId);

  const { data, error } = await supabase
    .from('player_pokemon')
    .update({ pokemon_id: newPokemonId })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .select()
    .single<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to evolve Pokemon: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: newPokemonId,
    gameName: 'Evolution',
    result: 'evolved',
    sourceSystem,
    loggedBy: `Used ${stoneName}.`,
  });

  return mapOwnedPokemon(data);
}

export async function getOwnedPokemonBySpecies(
  playerId: string,
  pokemonDataId: string | number,
): Promise<OwnedPokemon | null> {
  const pokemonId = toPokemonDbId(pokemonDataId);

  const { data, error } = await supabase
    .from('player_pokemon')
    .select()
    .eq('player_id', playerId)
    .eq('pokemon_id', pokemonId)
    .maybeSingle<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to find owned Pokemon: ${error.message}`);
  }

  return data ? mapOwnedPokemon(data) : null;
}

