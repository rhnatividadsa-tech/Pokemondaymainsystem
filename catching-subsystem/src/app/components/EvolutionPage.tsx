import { useState } from 'react';
import { OwnedPokemon, InventoryItem } from '../store/gameStore';
import { getPokemonById, getTypeColor } from '../../../../shared/data/pokemonData';
import { PokemonSprite, TypeBadge, LevelBadge, PokeHeader, PokeCard, EmptyState } from './PokeShared';

interface Props {
  ownedPokemon: OwnedPokemon[];
  inventory: InventoryItem[];
  onEvolve: (ownedId: string, newPokemonDataId: string, newName: string, stoneName: string) => boolean;
  onBack: () => void;
}

export function EvolutionPage({ ownedPokemon, inventory, onEvolve, onBack }: Props) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [evolving, setEvolving] = useState<string | null>(null);

  const evolvable = ownedPokemon.filter(owned => {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd || !pd.evolvesTo || !pd.requiredStone) return false;
    const stage = pd.evolutionStage;
    const reqLevel = stage === 1 ? 20 : stage === 2 ? 40 : null;
    if (reqLevel === null) return false;
    return owned.level >= reqLevel;
  });

  const notReady = ownedPokemon.filter(owned => {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd || !pd.evolvesTo || !pd.requiredStone) return false;
    const stage = pd.evolutionStage;
    const reqLevel = stage === 1 ? 20 : stage === 2 ? 40 : null;
    if (reqLevel === null) return false;
    return owned.level < reqLevel;
  });

  function tryEvolve(owned: OwnedPokemon) {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd || !pd.evolvesTo || !pd.requiredStone) return;
    const nextPd = getPokemonById(pd.evolvesTo);
    if (!nextPd) return;

    const stoneInInv = inventory.find(i => i.itemName === pd.requiredStone && i.quantity > 0);
    if (!stoneInInv) {
      setMessage({ text: `You need a ${pd.requiredStone} to evolve ${pd.name}!`, ok: false });
      setTimeout(() => setMessage(null), 2500);
      return;
    }

    setEvolving(owned.id);
    const success = onEvolve(owned.id, pd.evolvesTo, nextPd.name, pd.requiredStone!);
    if (success) {
      setMessage({ text: `${pd.name} evolved into ${nextPd.name}! ✨`, ok: true });
    } else {
      setMessage({ text: `Evolution failed. Check your stones.`, ok: false });
    }
    setEvolving(null);
    setTimeout(() => setMessage(null), 3000);
  }

  function getRequirements(owned: OwnedPokemon) {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd) return null;
    const stage = pd.evolutionStage;
    const reqLevel = stage === 1 ? 20 : stage === 2 ? 40 : null;
    const nextPd = pd.evolvesTo ? getPokemonById(pd.evolvesTo) : null;
    const hasStone = inventory.some(i => i.itemName === pd.requiredStone && i.quantity > 0);
    return { reqLevel, nextPd, hasStone, stone: pd.requiredStone };
  }

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader title="Evolution" onBack={onBack} />
      <div className="flex-1 p-4 flex flex-col gap-4">
        {message && (
          <div
            className="rounded-xl p-3 text-sm font-semibold text-center"
            style={{
              background: message.ok ? '#F0FFF4' : '#FFF5F5',
              color: message.ok ? '#276749' : '#C53030',
              border: `1px solid ${message.ok ? '#C6F6D5' : '#FED7D7'}`,
            }}
          >
            {message.ok ? '✨ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Evolution rules */}
        <PokeCard className="p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Evolution Requirements</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div className="rounded-lg p-2" style={{ background: '#FFF5F5' }}>
              <p className="font-semibold text-gray-700">Stage 1 → 2</p>
              <p>Level 20 + correct stone</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: '#FFF5F5' }}>
              <p className="font-semibold text-gray-700">Stage 2 → 3</p>
              <p>Level 40 + correct stone</p>
            </div>
          </div>
        </PokeCard>

        {/* Ready to evolve */}
        {evolvable.length > 0 && (
          <div>
            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-2">✨ Ready to Evolve ({evolvable.length})</p>
            <div className="flex flex-col gap-3">
              {evolvable.map((owned, index) => {
                const pd = getPokemonById(owned.pokemonDataId);
                const req = getRequirements(owned);
                if (!pd || !req) return null;
                const typeColor = getTypeColor(pd.type);
                const isEvolving = evolving === owned.id;

                return (
                  <PokeCard key={owned.id} className="p-4 " style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-xl p-2 float" style={{ background: typeColor.bg, border: `2px solid ${typeColor.border}`, animationDelay: `${index * 0.2}s` }}>
                        <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={60} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800">{pd.name}</span>
                          <LevelBadge level={owned.level} />
                        </div>
                        <TypeBadge type={pd.type} />
                      </div>
                      {req.nextPd && (
                        <>
                          <div className="flex flex-col items-center text-gray-400 ">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                            <span className="text-xs">evolves</span>
                          </div>
                          <div className="rounded-xl p-2 float-reverse glow-" style={{ background: '#F0FFF4', border: '2px solid #C6F6D5', animationDelay: `${index * 0.2 + 0.5}s` }}>
                            <PokemonSprite spriteId={req.nextPd.spriteId} name={req.nextPd.name} size={60} />
                          </div>
                        </>
                      )}
                    </div>

                    {req.nextPd && (
                      <p className="text-xs text-center text-gray-500 mb-3">
                        {pd.name} → <strong>{req.nextPd.name}</strong> using <strong>{req.stone}</strong>
                      </p>
                    )}

                    {req.hasStone ? (
                      <button
                        onClick={() => tryEvolve(owned)}
                        disabled={isEvolving}
                        className="w-full py-3 rounded-xl font-bold text-white text-sm  "
                        style={{ background: 'linear-gradient(135deg, #805AD5, #9F7AEA)' }}
                      >
                        {isEvolving ? 'Evolving...' : `✨ Evolve with ${req.stone}`}
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded-xl text-center text-sm text-red-500 font-semibold" style={{ background: '#FFF5F5', border: '1px solid #FED7D7' }}>
                        Need <strong>{req.stone}</strong> (buy from Store)
                      </div>
                    )}
                  </PokeCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Not ready */}
        {notReady.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">In Progress ({notReady.length})</p>
            <div className="flex flex-col gap-2">
              {notReady.map(owned => {
                const pd = getPokemonById(owned.pokemonDataId);
                const req = getRequirements(owned);
                if (!pd || !req) return null;
                const progress = Math.min(100, (owned.level / (req.reqLevel ?? 20)) * 100);

                return (
                  <PokeCard key={owned.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={48} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-700 text-sm">{pd.name}</span>
                          <LevelBadge level={owned.level} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #CC0000, #FF4444)',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">Lv.{req.reqLevel}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Math.max(0, (req.reqLevel ?? 0) - owned.level)} more levels needed • {req.stone}
                        </p>
                      </div>
                    </div>
                  </PokeCard>
                );
              })}
            </div>
          </div>
        )}

        {ownedPokemon.filter(o => {
          const pd = getPokemonById(o.pokemonDataId);
          return pd && pd.evolvesTo;
        }).length === 0 && (
          <EmptyState icon="✨" message="No Pokémon to evolve yet. Catch some starters and level them up!" />
        )}
      </div>
    </div>
  );
}
