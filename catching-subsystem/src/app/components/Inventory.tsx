import { useState } from 'react';
import { InventoryItem, OwnedPokemon } from '../store/gameStore';
import { getPokemonById } from '../../../../shared/data/pokemonData';
import { PokemonSprite, LevelBadge, TypeBadge, PokeHeader, PokeCard, EmptyState } from './PokeShared';

interface Props {
  items: InventoryItem[];
  ownedPokemon: OwnedPokemon[];
  playerName: string;
  onUseRareCandy: (ownedId: string, pokemonName: string) => boolean;
  onBack: () => void;
}

const ITEM_ICONS: Record<string, string> = {
  'Fire Stone': '🔥',
  'Water Stone': '💧',
  'Leaf Stone': '🍃',
  'Thunder Stone': '⚡',
  'Rare Candy': '🍬',
};

export function Inventory({ items, ownedPokemon, playerName, onUseRareCandy, onBack }: Props) {
  const [selectingPokemon, setSelectingPokemon] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const rareCandyCount = items.find(i => i.itemName === 'Rare Candy')?.quantity ?? 0;

  function handleUseRareCandy(owned: OwnedPokemon) {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd) return;
    const success = onUseRareCandy(owned.id, pd.name);
    if (success) {
      setMessage({ text: `${pd.name} gained +5 levels!`, ok: true });
    } else {
      setMessage({ text: 'No Rare Candy available!', ok: false });
    }
    setSelectingPokemon(false);
    setTimeout(() => setMessage(null), 2500);
  }

  if (selectingPokemon) {
    return (
      <div className="flex flex-col min-h-full">
        <PokeHeader title="Use Rare Candy" onBack={() => setSelectingPokemon(false)} />
        <div className="flex-1 p-4">
          <p className="text-sm text-gray-500 mb-3">Select a Pokémon to give the Rare Candy to (+5 levels)</p>
          {ownedPokemon.length === 0 ? (
            <EmptyState icon="🎒" message="No Pokémon available" />
          ) : (
            <div className="flex flex-col gap-2">
              {ownedPokemon.map(owned => {
                const pd = getPokemonById(owned.pokemonDataId);
                if (!pd) return null;
                return (
                  <button
                    key={owned.id}
                    onClick={() => handleUseRareCandy(owned)}
                    className="w-full bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 hover:border-yellow-300   text-left shadow-sm"
                  >
                    <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={52} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{pd.name}</span>
                        <LevelBadge level={owned.level} />
                      </div>
                      <TypeBadge type={pd.type} />
                    </div>
                    <span className="text-yellow-500 font-bold text-sm">+5 Lv</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader
        title="Inventory"
        onBack={onBack}
        rightContent={
          <span className="text-white/80 text-sm">{items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
        }
      />
      <div className="flex-1 p-4 flex flex-col gap-4">
        {message && (
          <div
            className="rounded-xl p-3 text-sm font-semibold text-center"
            style={{
              background: message.ok ? '#FFFFF0' : '#FFF5F5',
              color: message.ok ? '#744210' : '#C53030',
              border: `1px solid ${message.ok ? '#F6E05E' : '#FED7D7'}`,
            }}
          >
            {message.ok ? '🍬 ' : '❌ '}{message.text}
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState icon="🎒" message="Your inventory is empty. Visit the Pokémon Store to buy items!" />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, index) => {
              const isCandy = item.itemName === 'Rare Candy';
              return (
                <PokeCard key={item.itemName} className="p-4 " style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: '#FFF5F5' }}
                    >
                      {ITEM_ICONS[item.itemName] ?? '📦'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold text-gray-800">{item.itemName}</h3>
                        <span
                          className="px-2.5 py-1 rounded-full text-sm font-bold"
                          style={{ background: '#1a1a2e', color: '#FFDE00' }}
                        >
                          ×{item.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {isCandy ? 'Adds +5 levels to a Pokémon' : `Used for ${item.itemName.replace(' Stone', '')}-type evolution`}
                      </p>
                    </div>
                  </div>
                  {isCandy && item.quantity > 0 && (
                    <button
                      onClick={() => setSelectingPokemon(true)}
                      className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm text-white  "
                      style={{ background: 'linear-gradient(135deg, #D69E2E, #ECC94B)' }}
                    >
                      Use Rare Candy 🍬
                    </button>
                  )}
                  {!isCandy && (
                    <p className="mt-2 text-xs text-gray-400 text-center">
                      Use in the Evolution page to evolve Pokémon
                    </p>
                  )}
                </PokeCard>
              );
            })}
          </div>
        )}

        <PokeCard className="p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">💡 How to use items</p>
          <ul className="text-xs text-gray-500 flex flex-col gap-1">
            <li>• <strong>Evolution Stones</strong> → Used in the Evolution page</li>
            <li>• <strong>Rare Candy</strong> → Tap "Use Rare Candy" and pick a Pokémon</li>
            <li>• Buy more items from the Pokémon Store</li>
          </ul>
        </PokeCard>
      </div>
    </div>
  );
}
