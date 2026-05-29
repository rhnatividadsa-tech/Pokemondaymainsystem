import { useState } from 'react';
import { OwnedPokemon } from '../store/gameStore';
import { getPokemonById, getTypeColor } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, TypeBadge, RegionBadge, LevelBadge, SourceBadge, PokeHeader, PokeCard, EmptyState } from './PokeShared';

interface Props {
  ownedPokemon: OwnedPokemon[];
  onBack: () => void;
}

export function Pokedex({ ownedPokemon, onBack }: Props) {
  const [filter, setFilter] = useState<'All' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Normal' | 'Rock' | 'Ghost'>('All');
  const [selected, setSelected] = useState<OwnedPokemon | null>(null);
  const [search, setSearch] = useState('');

  const types = ['All', 'Fire', 'Water', 'Grass', 'Electric', 'Normal', 'Rock', 'Ghost'] as const;

  const filtered = ownedPokemon.filter(owned => {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd) return false;
    const matchType = filter === 'All' || pd.type === filter;
    const matchSearch = !search || pd.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (selected) {
    const pd = getPokemonById(selected.pokemonDataId);
    if (!pd) return null;
    const typeColor = getTypeColor(pd.type);
    const evolutionLvl = pd.evolutionStage === 1 ? 20 : pd.evolutionStage === 2 ? 40 : null;
    const canEvolve = pd.evolvesTo && evolutionLvl !== null && selected.level >= evolutionLvl;

    return (
      <div className="flex flex-col min-h-full">
        <PokeHeader title={pd.name} onBack={() => setSelected(null)} />
        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Sprite card */}
          <div
            className="rounded-3xl flex items-center justify-center py-8"
            style={{ background: `linear-gradient(135deg, ${typeColor.bg}, white)`, border: `2px solid ${typeColor.border}` }}
          >
            <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={140} />
          </div>

          {/* Info */}
          <PokeCard className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-xl">{pd.name}</h2>
              <LevelBadge level={selected.level} />
            </div>

            <div className="flex gap-2 flex-wrap">
              <TypeBadge type={pd.type} />
              <RegionBadge region={pd.region} />
              <SourceBadge source={selected.source} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <Stat label="Evolution Stage" value={`Stage ${pd.evolutionStage}`} />
              <Stat label="Level" value={selected.level.toString()} />
              <Stat label="Caught" value={new Date(selected.caughtAt).toLocaleDateString()} />
              <Stat label="Status" value={selected.status} />
            </div>

            {pd.evolvesTo && (
              <div className="rounded-xl p-3 text-sm" style={{ background: canEvolve ? '#F0FFF4' : '#F7FAFC', border: `1px solid ${canEvolve ? '#38A169' : '#E2E8F0'}` }}>
                {canEvolve ? (
                  <p className="text-green-700">
                    ✨ Ready to evolve with <strong>{pd.requiredStone}</strong>! Go to the Evolution page.
                  </p>
                ) : (
                  <p className="text-gray-500">
                    Next evolution at Lv.{evolutionLvl} with {pd.requiredStone}. ({Math.max(0, (evolutionLvl ?? 0) - selected.level)} more levels needed)
                  </p>
                )}
              </div>
            )}
          </PokeCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader
        title="Pokédex"
        onBack={onBack}
        rightContent={
          <span className="text-white/80 text-sm font-semibold">{ownedPokemon.length} caught</span>
        }
      />

      <div className="flex flex-col gap-3 p-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search Pokémon..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none text-sm"
        />

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {types.map(type => {
            const color = type === 'All' ? null : getTypeColor(type);
            const active = filter === type;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap "
                style={{
                  background: active ? (color?.badge ?? '#CC0000') : '#f1f5f9',
                  color: active ? '#fff' : '#64748b',
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-3 pb-4">
        {filtered.length === 0 ? (
          <EmptyState icon="📔" message="No Pokémon found. Catch some in the wild or through games!" />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((owned, index) => {
              const pd = getPokemonById(owned.pokemonDataId);
              if (!pd) return null;
              const typeColor = getTypeColor(pd.type);
              return (
                <button
                  key={owned.id}
                  onClick={() => setSelected(owned)}
                  className="w-full bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 hover:shadow-md   text-left "
                  style={{ borderLeftWidth: 4, borderLeftColor: typeColor.border, animationDelay: `${index * 0.05}s` }}
                >
                  <div className="rounded-xl p-1.5 float" style={{ background: typeColor.bg, animationDelay: `${index * 0.1}s` }}>
                    <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={52} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-800 truncate">{pd.name}</span>
                      <LevelBadge level={owned.level} />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <TypeBadge type={pd.type} />
                      <RegionBadge region={pd.region} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pd.evolutionStage < 3 ? `Stage ${pd.evolutionStage} • Can evolve` : 'Final form'}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-700">{value}</p>
    </div>
  );
}
