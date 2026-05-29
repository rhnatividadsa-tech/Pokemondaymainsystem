import { supabase } from './supabaseClient';

export async function findOrCreatePlayer(playerName: string) {
  const cleanName = playerName.trim();

  const { data: existingPlayer, error: findError } = await supabase
    .from('players')
    .select('*')
    .ilike('player_name', cleanName)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingPlayer) {
    return existingPlayer;
  }

  const { data: newPlayer, error: createError } = await supabase
    .from('players')
    .insert({
      player_name: cleanName,
      coin_balance: 0,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return newPlayer;
}

export async function getPlayerDashboardStats(playerId: string) {
  const { data: pokedex, error } = await supabase
    .from('player_pokedex')
    .select('*')
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  const totalPokemonCaught = pokedex?.length ?? 0;

  const totalLevelPoints =
    pokedex?.reduce((sum, pokemon) => sum + (pokemon.level ?? 0), 0) ?? 0;

  return {
    pokedex: pokedex ?? [],
    totalPokemonCaught,
    totalLevelPoints,
  };
}

export async function saveStarterPokemon(playerId: string, pokemonId: string) {
  const { error: updateError } = await supabase
    .from('players')
    .update({
      starter_pokemon_id: pokemonId,
    })
    .eq('player_id', playerId);

  if (updateError) {
    throw updateError;
  }

  const { data: starterRecord, error: insertError } = await supabase
    .from('player_pokedex')
    .insert({
      player_id: playerId,
      pokemon_id: pokemonId,
      level: 5,
      source: 'Starter',
      status: 'Active',
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return starterRecord;
}