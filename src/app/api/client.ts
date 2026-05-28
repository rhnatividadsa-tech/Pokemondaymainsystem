import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a65c9262`;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Players
  async getPlayer(name: string) {
    return apiCall(`/players/${encodeURIComponent(name)}`);
  },

  async createOrGetPlayer(name: string) {
    return apiCall('/players', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async updatePlayer(id: string, updates: any) {
    return apiCall(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Pokemon
  async getPlayerPokemon(playerId: string) {
    return apiCall(`/pokemon/player/${playerId}`);
  },

  async addPokemon(data: {
    player_id: string;
    pokemon_data_id: string;
    level?: number;
    source: string;
  }) {
    return apiCall('/pokemon', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePokemon(id: string, updates: any) {
    return apiCall(`/pokemon/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Inventory
  async getInventory(playerId: string) {
    return apiCall(`/inventory/${playerId}`);
  },

  async updateInventory(playerId: string, itemName: string, quantityChange: number) {
    return apiCall('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        player_id: playerId,
        item_name: itemName,
        quantity_change: quantityChange,
      }),
    });
  },

  // History
  async getHistory(playerId: string) {
    return apiCall(`/history/${playerId}`);
  },

  async addHistory(entry: any) {
    return apiCall('/history', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  // Bulk operations
  async getPlayerData(playerId: string) {
    return apiCall(`/player-data/${playerId}`);
  },
};
