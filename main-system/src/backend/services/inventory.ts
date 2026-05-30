import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import { updatePlayerCoins } from './players';
import { evolvePokemon as updateEvolution } from './pokemon';
import { InventoryItem, InventoryItemRow, mapInventoryItem, OwnedPokemon } from '../types';

async function getInventoryRow(playerId: string, itemName: string): Promise<InventoryItemRow | null> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select()
    .eq('player_id', playerId)
    .eq('item_name', itemName)
    .maybeSingle<InventoryItemRow>();

  if (error) {
    throw new Error(`Failed to load inventory item: ${error.message}`);
  }

  return data;
}

async function upsertInventoryQuantity(playerId: string, itemName: string, quantity: number): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .upsert(
      {
        player_id: playerId,
        item_name: itemName,
        quantity: Math.max(0, Math.trunc(quantity)),
      },
      { onConflict: 'player_id,item_name' },
    )
    .select()
    .single<InventoryItemRow>();

  if (error) {
    throw new Error(`Failed to save inventory item: ${error.message}`);
  }

  return mapInventoryItem(data);
}

/**
 * Buys an item: check coins, deduct coins, add item quantity, then log purchase.
 */
export async function buyStoreItem(playerId: string, itemName: string, price: number): Promise<InventoryItem> {
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('coins')
    .eq('id', playerId)
    .single<{ coins: number }>();

  if (playerError) {
    throw new Error(`Failed to load player for purchase: ${playerError.message}`);
  }

  if (player.coins < price) {
    throw new Error(`Not enough coins to buy ${itemName}.`);
  }

  const existing = await getInventoryRow(playerId, itemName);
  await updatePlayerCoins(playerId, -Math.abs(price), 'Pokemon Store', 'store');
  const item = await upsertInventoryQuantity(playerId, itemName, (existing?.quantity ?? 0) + 1);

  await addHistoryLog({
    playerId,
    gameName: 'Pokemon Store',
    result: 'purchased',
    coinsEarned: -Math.abs(price),
    sourceSystem: 'store',
    notes: `Bought ${itemName}.`,
  });

  return item;
}

/**
 * Consumes inventory safely. Quantity never drops below zero.
 */
export async function consumeInventoryItem(
  playerId: string,
  itemName: string,
  quantity = 1,
  reason = 'Inventory',
): Promise<InventoryItem> {
  const existing = await getInventoryRow(playerId, itemName);
  const amount = Math.max(1, Math.trunc(quantity));

  if (!existing || existing.quantity < amount) {
    throw new Error(`Not enough ${itemName} in inventory.`);
  }

  const item = await upsertInventoryQuantity(playerId, itemName, existing.quantity - amount);

  await addHistoryLog({
    playerId,
    gameName: reason,
    result: 'item consumed',
    sourceSystem: 'main_system',
    notes: `Used ${amount} ${itemName}.`,
  });

  return item;
}

/**
 * Full evolution workflow: consume the required stone, update Pokemon species,
 * and write history for both inventory use and evolution.
 */
export async function evolvePokemon(
  playerId: string,
  ownedPokemonId: string,
  newPokemonDataId: string,
  stoneName: string,
): Promise<OwnedPokemon> {
  await consumeInventoryItem(playerId, stoneName, 1, 'Evolution');
  return updateEvolution(playerId, ownedPokemonId, newPokemonDataId, stoneName, 'main_system');
}

