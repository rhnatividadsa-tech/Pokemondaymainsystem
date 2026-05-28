import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { getPokemonByName } from '../data/pokemonData';

export interface Player {
  id: string;
  name: string;
  section?: string;
  assigned_journey?: string;
  starter_pokemon_id?: string;
  coins: number;
  created_at: string;
}

export interface OwnedPokemon {
  id: string;
  player_id: string;
  pokemon_data_id: string;
  level: number;
  source: 'Starter' | 'PokeReflex' | 'PokeGuess' | 'IRL Catch' | 'Manual Log';
  status: 'Active';
  caught_at: string;
}

export interface InventoryItem {
  item_name: string;
  quantity: number;
}

export interface GameHistoryEntry {
  id: string;
  player_id: string;
  pokemon_id?: string;
  game_name: string;
  result: string;
  level_gain: number;
  coins_earned: number;
  source_system: string;
  notes?: string;
  created_at: string;
}

export function useGameStore() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerPokemon, setPlayerPokemon] = useState<OwnedPokemon[]>([]);
  const [playerInventory, setPlayerInventory] = useState<InventoryItem[]>([]);
  const [playerHistory, setPlayerHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load player data when currentPlayer changes
  useEffect(() => {
    if (currentPlayer) {
      loadPlayerData(currentPlayer.id);
    } else {
      setPlayerPokemon([]);
      setPlayerInventory([]);
      setPlayerHistory([]);
    }
  }, [currentPlayer?.id]);

  const loadPlayerData = async (playerId: string) => {
    try {
      const data = await api.getPlayerData(playerId);
      setPlayerPokemon(data.pokemon || []);
      setPlayerInventory(data.inventory || []);
      setPlayerHistory(data.history || []);
    } catch (error) {
      console.error('Error loading player data:', error);
    }
  };

  const findOrCreatePlayer = useCallback(async (name: string): Promise<{ player: Player; isNew: boolean }> => {
    try {
      setLoading(true);
      const result = await api.createOrGetPlayer(name);
      setCurrentPlayer(result.player);
      return { player: result.player, isNew: result.isNew };
    } catch (error) {
      console.error('Error finding/creating player:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const setStarterPokemon = useCallback(async (playerId: string, pokemonDataId: string, pokemonName: string) => {
    try {
      // Update player's starter
      await api.updatePlayer(playerId, { starter_pokemon_id: pokemonDataId });

      // Add Pokemon to owned
      const pokemonRes = await api.addPokemon({
        player_id: playerId,
        pokemon_data_id: pokemonDataId,
        level: 5,
        source: 'Starter',
      });

      // Add history entry
      await api.addHistory({
        player_id: playerId,
        pokemon_id: pokemonDataId,
        game_name: 'Starter Selection',
        result: 'selected',
        level_gain: 0,
        coins_earned: 0,
        source_system: 'main_system',
        notes: `${currentPlayer?.name} selected ${pokemonName} as starter.`,
      });

      // Refresh data
      if (currentPlayer) {
        const updatedPlayer = await api.getPlayer(currentPlayer.name);
        setCurrentPlayer(updatedPlayer.player);
        await loadPlayerData(playerId);
      }
    } catch (error) {
      console.error('Error setting starter:', error);
      throw error;
    }
  }, [currentPlayer]);

  const buyItem = useCallback(async (playerId: string, itemName: string, price: number): Promise<boolean> => {
    try {
      if (!currentPlayer || currentPlayer.coins < price) return false;

      // Update coins
      await api.updatePlayer(playerId, { coins: currentPlayer.coins - price });

      // Add item to inventory
      await api.updateInventory(playerId, itemName, 1);

      // Add history
      await api.addHistory({
        player_id: playerId,
        game_name: 'Pokémon Store',
        result: 'purchased',
        level_gain: 0,
        coins_earned: -price,
        source_system: 'store',
        notes: `${currentPlayer.name} bought ${itemName}.`,
      });

      // Refresh data
      const updatedPlayer = await api.getPlayer(currentPlayer.name);
      setCurrentPlayer(updatedPlayer.player);
      await loadPlayerData(playerId);

      return true;
    } catch (error) {
      console.error('Error buying item:', error);
      return false;
    }
  }, [currentPlayer]);

  const evolvePokemon = useCallback(async (
    playerId: string,
    ownedId: string,
    newPokemonDataId: string,
    newName: string,
    stoneName: string
  ): Promise<boolean> => {
    try {
      const stone = playerInventory.find(i => i.item_name === stoneName);
      if (!stone || stone.quantity < 1) return false;

      // Update Pokemon
      await api.updatePokemon(ownedId, { pokemon_data_id: newPokemonDataId });

      // Remove stone from inventory
      await api.updateInventory(playerId, stoneName, -1);

      // Add history
      await api.addHistory({
        player_id: playerId,
        pokemon_id: newPokemonDataId,
        game_name: 'Evolution',
        result: 'evolved',
        level_gain: 0,
        coins_earned: 0,
        source_system: 'main_system',
        notes: `${currentPlayer?.name} evolved to ${newName} using ${stoneName}.`,
      });

      // Refresh data
      await loadPlayerData(playerId);

      return true;
    } catch (error) {
      console.error('Error evolving Pokemon:', error);
      return false;
    }
  }, [playerInventory, currentPlayer]);

  const updatePokemonLevel = useCallback(async (
    playerId: string,
    ownedId: string,
    levelGain: number,
    coinsEarned: number,
    gameName: string,
    result: string,
    sourceSystem: string,
    notes?: string
  ) => {
    try {
      if (!currentPlayer) return;

      // Update Pokemon level if ownedId exists
      if (ownedId) {
        const pokemon = playerPokemon.find(p => p.id === ownedId);
        if (pokemon) {
          await api.updatePokemon(ownedId, { level: pokemon.level + levelGain });
        }
      }

      // Update player coins
      if (coinsEarned !== 0) {
        await api.updatePlayer(playerId, { coins: Math.max(0, currentPlayer.coins + coinsEarned) });
      }

      // Add history
      await api.addHistory({
        player_id: playerId,
        game_name: gameName,
        result,
        level_gain: levelGain,
        coins_earned: coinsEarned,
        source_system: sourceSystem,
        notes,
      });

      // Refresh data
      const updatedPlayer = await api.getPlayer(currentPlayer.name);
      setCurrentPlayer(updatedPlayer.player);
      await loadPlayerData(playerId);
    } catch (error) {
      console.error('Error updating Pokemon level:', error);
    }
  }, [currentPlayer, playerPokemon]);

  const addPokemonToPlayer = useCallback(async (
    playerId: string,
    pokemonDataId: string,
    source: OwnedPokemon['source'],
    coinsEarned: number,
    gameName: string,
    notes?: string
  ): Promise<OwnedPokemon | null> => {
    try {
      // Add Pokemon
      const pokemonRes = await api.addPokemon({
        player_id: playerId,
        pokemon_data_id: pokemonDataId,
        level: 5,
        source,
      });

      // Update coins if earned
      if (coinsEarned !== 0 && currentPlayer) {
        await api.updatePlayer(playerId, { coins: Math.max(0, currentPlayer.coins + coinsEarned) });
      }

      // Add history
      await api.addHistory({
        player_id: playerId,
        pokemon_id: pokemonDataId,
        game_name: gameName,
        result: 'caught',
        level_gain: 0,
        coins_earned: coinsEarned,
        source_system: 'main_system',
        notes,
      });

      // Refresh data
      if (currentPlayer) {
        const updatedPlayer = await api.getPlayer(currentPlayer.name);
        setCurrentPlayer(updatedPlayer.player);
      }
      await loadPlayerData(playerId);

      return pokemonRes.pokemon;
    } catch (error) {
      console.error('Error adding Pokemon:', error);
      return null;
    }
  }, [currentPlayer]);

  const useRareCandy = useCallback(async (
    playerId: string,
    ownedId: string,
    pokemonName: string
  ): Promise<boolean> => {
    try {
      const candy = playerInventory.find(i => i.item_name === 'Rare Candy');
      if (!candy || candy.quantity < 1) return false;

      const pokemon = playerPokemon.find(p => p.id === ownedId);
      if (!pokemon) return false;

      // Update Pokemon level
      await api.updatePokemon(ownedId, { level: pokemon.level + 5 });

      // Remove candy from inventory
      await api.updateInventory(playerId, 'Rare Candy', -1);

      // Add history
      await api.addHistory({
        player_id: playerId,
        game_name: 'Inventory',
        result: 'used item',
        level_gain: 5,
        coins_earned: 0,
        source_system: 'main_system',
        notes: `${currentPlayer?.name} used Rare Candy on ${pokemonName} (+5 levels).`,
      });

      // Refresh data
      await loadPlayerData(playerId);

      return true;
    } catch (error) {
      console.error('Error using Rare Candy:', error);
      return false;
    }
  }, [playerInventory, playerPokemon, currentPlayer]);

  const processSubsystemResult = useCallback(async (result: {
    playerName: string;
    pokemonName?: string;
    gameName: string;
    result: string;
    levelGain: number;
    coinsEarned: number;
    sourceSystem: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentPlayer || currentPlayer.name.toLowerCase() !== result.playerName.toLowerCase()) {
        return { success: false, message: `Player "${result.playerName}" not current player.` };
      }

      const pd = result.pokemonName ? getPokemonByName(result.pokemonName) : undefined;
      const ownedMatch = pd
        ? playerPokemon.find(o => o.pokemon_data_id === pd.id)
        : undefined;

      if (result.result === 'caught' && pd && !ownedMatch) {
        await addPokemonToPlayer(
          currentPlayer.id,
          pd.id,
          result.sourceSystem.includes('catch') ? 'PokeReflex' : 'Manual Log',
          result.coinsEarned,
          result.gameName,
          `${currentPlayer.name} caught ${pd.name} through ${result.gameName}.`
        );
      } else if (ownedMatch && result.levelGain > 0) {
        await updatePokemonLevel(
          currentPlayer.id,
          ownedMatch.id,
          result.levelGain,
          result.coinsEarned,
          result.gameName,
          result.result,
          result.sourceSystem,
          `${currentPlayer.name} gained +${result.levelGain} levels from ${result.gameName}.`
        );
      } else {
        // Just add history and coins
        if (result.coinsEarned !== 0) {
          await api.updatePlayer(currentPlayer.id, {
            coins: Math.max(0, currentPlayer.coins + result.coinsEarned)
          });
        }

        await api.addHistory({
          player_id: currentPlayer.id,
          pokemon_id: ownedMatch?.pokemon_data_id,
          game_name: result.gameName,
          result: result.result,
          level_gain: result.levelGain,
          coins_earned: result.coinsEarned,
          source_system: result.sourceSystem,
        });

        const updatedPlayer = await api.getPlayer(currentPlayer.name);
        setCurrentPlayer(updatedPlayer.player);
        await loadPlayerData(currentPlayer.id);
      }

      return { success: true, message: `Result processed for ${currentPlayer.name}.` };
    } catch (error) {
      console.error('Error processing subsystem result:', error);
      return { success: false, message: String(error) };
    }
  }, [currentPlayer, playerPokemon, addPokemonToPlayer, updatePokemonLevel]);

  const logout = useCallback(() => {
    setCurrentPlayer(null);
    setPlayerPokemon([]);
    setPlayerInventory([]);
    setPlayerHistory([]);
  }, []);

  const getPlayerPokemon = useCallback((playerId: string) => {
    return currentPlayer?.id === playerId ? playerPokemon : [];
  }, [currentPlayer, playerPokemon]);

  const getPlayerInventory = useCallback((playerId: string) => {
    return currentPlayer?.id === playerId ? playerInventory : [];
  }, [currentPlayer, playerInventory]);

  const getPlayerHistory = useCallback((playerId: string) => {
    return currentPlayer?.id === playerId ? playerHistory : [];
  }, [currentPlayer, playerHistory]);

  return {
    state: {
      players: currentPlayer ? [currentPlayer] : [],
      ownedPokemon: playerPokemon,
      inventory: currentPlayer ? { [currentPlayer.id]: playerInventory } : {},
      history: playerHistory,
      currentPlayerId: currentPlayer?.id || null,
    },
    currentPlayer,
    loading,
    getPlayerPokemon,
    getPlayerInventory,
    getPlayerHistory,
    findOrCreatePlayer,
    setStarterPokemon,
    buyItem,
    evolvePokemon,
    updatePokemonLevel,
    addPokemonToPlayer,
    useRareCandy,
    processSubsystemResult,
    logout,
  };
}
