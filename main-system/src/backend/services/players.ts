import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import { clampCoins, mapPlayer, Player, PlayerRow } from '../types';

function normalizePlayerName(playerName: string): string {
  const name = playerName.trim();
  if (!name) {
    throw new Error('Player name is required.');
  }
  return name;
}

/**
 * Finds a player by name using the schema's case-insensitive unique rule.
 */
export async function getPlayerByName(playerName: string): Promise<Player | null> {
  const name = normalizePlayerName(playerName);
  const { data, error } = await supabase
    .from('players')
    .select()
    .ilike('name', name)
    .maybeSingle<PlayerRow>();

  if (error) {
    throw new Error(`Failed to get player by name: ${error.message}`);
  }

  return data ? mapPlayer(data) : null;
}

/**
 * Used by login/start journey. Existing names resume the same player record;
 * new names create a row in players.
 */
export async function findOrCreatePlayer(playerName: string): Promise<{ player: Player; isNew: boolean }> {
  const name = normalizePlayerName(playerName);
  const existing = await getPlayerByName(name);

  if (existing) {
    return { player: existing, isNew: false };
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ name, coins: 0 })
    .select()
    .single<PlayerRow>();

  if (error) {
    throw new Error(`Failed to create player: ${error.message}`);
  }

  const player = mapPlayer(data);
  await addHistoryLog({
    playerId: player.id,
    gameName: 'Journey Started',
    result: 'created',
    sourceSystem: 'main_system',
    notes: `${player.name} started a Pokemon journey.`,
  });

  return { player, isNew: true };
}

/**
 * Adds or removes coins while respecting the database rule that coins cannot
 * be negative. A history row is written for every explicit coin update.
 */
export async function updatePlayerCoins(
  playerId: string,
  amountDelta: number,
  reason = 'Coin Update',
  sourceSystem = 'main_system',
): Promise<Player> {
  const { data: playerRow, error: fetchError } = await supabase
    .from('players')
    .select()
    .eq('id', playerId)
    .single<PlayerRow>();

  if (fetchError) {
    throw new Error(`Failed to load player coins: ${fetchError.message}`);
  }

  const nextCoins = clampCoins(playerRow.coins + amountDelta);

  const { data, error } = await supabase
    .from('players')
    .update({ coins: nextCoins })
    .eq('id', playerId)
    .select()
    .single<PlayerRow>();

  if (error) {
    throw new Error(`Failed to update player coins: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    gameName: reason,
    result: amountDelta >= 0 ? 'coins added' : 'coins spent',
    coinsEarned: amountDelta,
    sourceSystem,
    notes: `Coins changed by ${amountDelta}. Current balance: ${nextCoins}.`,
  });

  return mapPlayer(data);
}

