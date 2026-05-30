import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import {
  clampLevel,
  mapOwnedPokemon,
  OwnedPokemon,
  OwnedPokemonRow,
  PokemonSource,
} from '../types';

/**
 * Adds a newly caught Pokemon to owned_pokemon and logs the catch.
 */
export async function addCaughtPokemon(
  playerId: string,
  pokemonDataId: string,
  source: PokemonSource = 'Manual Log',
  coinsEarned = 0,
  gameName = 'Pokemon Catch',
  notes?: string,
  sourceSystem = source === 'Manual Log' ? 'facilitator' : source,
): Promise<OwnedPokemon> {
  const { data, error } = await supabase
    .from('owned_pokemon')
    .insert({
      player_id: playerId,
      pokemon_data_id: pokemonDataId,
      level: 5,
      source,
      status: 'Active',
    })
    .select()
    .single<OwnedPokemonRow>();

  if (error) {
    throw new Error(`Failed to add caught Pokemon: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: pokemonDataId,
    gameName,
    result: 'caught',
    coinsEarned,
    sourceSystem,
    notes: notes ?? `Caught Pokemon ${pokemonDataId}.`,
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
    .from('owned_pokemon')
    .select()
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .single<OwnedPokemonRow>();

  if (fetchError) {
    throw new Error(`Failed to load Pokemon level: ${fetchError.message}`);
  }

  const safeLevelGain = Math.max(0, Math.trunc(levelGain));
  const nextLevel = clampLevel(currentRow.level + safeLevelGain);

  const { data, error } = await supabase
    .from('owned_pokemon')
    .update({ level: nextLevel })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .select()
    .single<OwnedPokemonRow>();

  if (error) {
    throw new Error(`Failed to update Pokemon level: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: data.pokemon_data_id,
    gameName,
    result,
    levelGain: nextLevel - currentRow.level,
    coinsEarned,
    sourceSystem,
    notes: notes ?? `Pokemon ${data.pokemon_data_id} reached level ${nextLevel}.`,
  });

  return mapOwnedPokemon(data);
}

/**
 * Evolves an owned Pokemon after inventory service has confirmed/consumed the
 * required stone. This function only changes owned_pokemon and logs evolution.
 */
export async function evolvePokemon(
  playerId: string,
  ownedPokemonId: string,
  newPokemonDataId: string,
  stoneName: string,
  sourceSystem = 'main_system',
): Promise<OwnedPokemon> {
  const { data, error } = await supabase
    .from('owned_pokemon')
    .update({ pokemon_data_id: newPokemonDataId })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .select()
    .single<OwnedPokemonRow>();

  if (error) {
    throw new Error(`Failed to evolve Pokemon: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: newPokemonDataId,
    gameName: 'Evolution',
    result: 'evolved',
    sourceSystem,
    notes: `Pokemon evolved to ${newPokemonDataId} using ${stoneName}.`,
  });

  return mapOwnedPokemon(data);
}

export async function getOwnedPokemonBySpecies(
  playerId: string,
  pokemonDataId: string,
): Promise<OwnedPokemon | null> {
  const { data, error } = await supabase
    .from('owned_pokemon')
    .select()
    .eq('player_id', playerId)
    .eq('pokemon_data_id', pokemonDataId)
    .maybeSingle<OwnedPokemonRow>();

  if (error) {
    throw new Error(`Failed to find owned Pokemon: ${error.message}`);
  }

  return data ? mapOwnedPokemon(data) : null;
}
