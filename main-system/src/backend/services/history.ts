import { supabase } from '../supabaseClient';
import { GameHistoryEntry, GameHistoryRow, HistoryLogInput, mapHistoryEntry } from '../types';

/**
 * Writes one immutable audit entry to game_history.
 * All gameplay services call this after they change player state.
 */
export async function addHistoryLog(input: HistoryLogInput): Promise<GameHistoryEntry> {
  const { data, error } = await supabase
    .from('game_history')
    .insert({
      player_id: input.playerId,
      pokemon_id: input.pokemonId ?? null,
      game_name: input.gameName,
      result: input.result,
      level_gain: input.levelGain ?? 0,
      coins_earned: input.coinsEarned ?? 0,
      source_system: input.sourceSystem,
      notes: input.notes ?? null,
    })
    .select()
    .single<GameHistoryRow>();

  if (error) {
    throw new Error(`Failed to add history log: ${error.message}`);
  }

  return mapHistoryEntry(data);
}

