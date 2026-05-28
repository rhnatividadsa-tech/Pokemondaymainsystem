import { useState } from 'react';
import { Player, OwnedPokemon } from '../store/gameStoreSupabase';
import { POKEMON_DATABASE, getPokemonById, PokemonData } from '../data/pokemonData';
import { PokemonSprite, TypeBadge, LevelBadge, PokeHeader, PokeCard } from './PokeShared';

interface Props {
  players: Player[];
  allOwnedPokemon: OwnedPokemon[];
  onLogResult: (
    playerId: string,
    ownedId: string | null,
    pokemonDataId: string | null,
    levelGain: number,
    coinsEarned: number,
    gameName: string,
    result: string,
    sourceSystem: string,
    notes: string,
    addNewPokemon: boolean,
  ) => Promise<void>;
  onBack: () => void;
}

const GAME_NAMES = [
  'IRL Catch a Pokémon',
  'Pokémon Showdown Battle',
  'PokeReflex',
  'PokeGuess',
  'Quiz Battle',
  'Speed Challenge',
  'Custom Game',
];

const RESULT_OPTIONS = [
  { value: 'Win / Correct', levelGain: 10, coinsEarned: 15 },
  { value: 'Caught', levelGain: 0, coinsEarned: 20 },
  { value: 'Partial', levelGain: 1, coinsEarned: 5 },
  { value: 'Lose / Wrong', levelGain: 0, coinsEarned: 0 },
  { value: 'Custom', levelGain: 0, coinsEarned: 0 },
];

export function FacilitatorLog({ players, allOwnedPokemon, onLogResult, onBack }: Props) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [gameName, setGameName] = useState(GAME_NAMES[0]);
  const [customGame, setCustomGame] = useState('');
  const [resultOption, setResultOption] = useState(RESULT_OPTIONS[0].value);
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [selectedPokemonData, setSelectedPokemonData] = useState<PokemonData | null>(null);
  const [addNewPokemon, setAddNewPokemon] = useState(false);
  const [customLevel, setCustomLevel] = useState(0);
  const [customCoins, setCustomCoins] = useState(0);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const playerPokemon = allOwnedPokemon.filter(o => o.playerId === selectedPlayerId);

  const resultDef = RESULT_OPTIONS.find(r => r.value === resultOption) ?? RESULT_OPTIONS[0];
  const isCustom = resultOption === 'Custom';
  const isCatch = resultOption === 'Caught';

  const levelGain = isCustom ? customLevel : resultDef.levelGain;
  const coinsEarned = isCustom ? customCoins : resultDef.coinsEarned;

  const pokemonSuggestions = pokemonSearch
    ? POKEMON_DATABASE.filter(p => p.name.toLowerCase().includes(pokemonSearch.toLowerCase())).slice(0, 5)
    : [];

  function selectPokemon(pd: PokemonData) {
    setSelectedPokemonData(pd);
    setPokemonSearch(pd.name);

    // Check if player already owns it
    const alreadyOwns = playerPokemon.some(o => o.pokemonDataId === pd.id);
    setAddNewPokemon(!alreadyOwns && isCatch);
  }

  function handleSubmit() {
    if (!selectedPlayerId) {
      setMessage({ text: 'Please select a player.', ok: false });
      return;
    }

    const finalGame = gameName === 'Custom Game' ? customGame || 'Custom Game' : gameName;

    // Find owned pokemon for leveling
    let ownedId: string | null = null;
    if (selectedPokemonData && !addNewPokemon) {
      const owned = playerPokemon.find(o => o.pokemonDataId === selectedPokemonData.id);
      ownedId = owned?.id ?? null;
    }

    onLogResult(
      selectedPlayerId,
      ownedId,
      selectedPokemonData?.id ?? null,
      levelGain,
      coinsEarned,
      finalGame,
      resultOption.toLowerCase(),
      'facilitator',
      notes,
      addNewPokemon && !!selectedPokemonData,
    );

    setMessage({ text: 'Result logged successfully!', ok: true });
    setNotes('');
    setSelectedPokemonData(null);
    setPokemonSearch('');
    setAddNewPokemon(false);
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader title="Facilitator Log" onBack={onBack} />
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FFF5F5', border: '1px solid #FED7D7' }}>
          <span>🔑</span>
          <p className="text-xs text-red-700 font-semibold">Facilitator Access — Manual Result Logger</p>
        </div>

        {message && (
          <div
            className="rounded-xl p-3 text-sm font-semibold text-center"
            style={{
              background: message.ok ? '#F0FFF4' : '#FFF5F5',
              color: message.ok ? '#276749' : '#C53030',
              border: `1px solid ${message.ok ? '#C6F6D5' : '#FED7D7'}`,
            }}
          >
            {message.ok ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Player */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">SELECT PLAYER</p>
          <select
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none"
          >
            <option value="">Choose a player...</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name} (🪙{p.coins})</option>
            ))}
          </select>
        </PokeCard>

        {/* Game name */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">GAME NAME</p>
          <select
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none mb-2"
          >
            {GAME_NAMES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {gameName === 'Custom Game' && (
            <input
              type="text"
              value={customGame}
              onChange={e => setCustomGame(e.target.value)}
              placeholder="Enter custom game name..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
            />
          )}
        </PokeCard>

        {/* Result */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">RESULT</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {RESULT_OPTIONS.map(r => (
              <button
                key={r.value}
                onClick={() => {
                  setResultOption(r.value);
                  if (r.value === 'Caught') setAddNewPokemon(true);
                  else setAddNewPokemon(false);
                }}
                className="py-2 px-3 rounded-xl text-sm font-semibold transition-all border-2"
                style={{
                  borderColor: resultOption === r.value ? '#CC0000' : '#E2E8F0',
                  background: resultOption === r.value ? '#FFF5F5' : '#fff',
                  color: resultOption === r.value ? '#CC0000' : '#4A5568',
                }}
              >
                {r.value}
              </button>
            ))}
          </div>
          {isCustom && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Level Gain</label>
                <input type="number" min="0" max="100" value={customLevel} onChange={e => setCustomLevel(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Coins Earned</label>
                <input type="number" min="0" max="500" value={customCoins} onChange={e => setCustomCoins(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none mt-1" />
              </div>
            </div>
          )}
          {!isCustom && (
            <div className="flex gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <span>+{levelGain} Lv</span>
              <span>+🪙{coinsEarned}</span>
            </div>
          )}
        </PokeCard>

        {/* Pokémon */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">POKÉMON INVOLVED (Optional)</p>
          <div className="relative">
            <input
              type="text"
              value={pokemonSearch}
              onChange={e => { setPokemonSearch(e.target.value); setSelectedPokemonData(null); }}
              placeholder="Search Pokémon name..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
            />
            {pokemonSuggestions.length > 0 && !selectedPokemonData && (
              <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                {pokemonSuggestions.map(pd => (
                  <button key={pd.id} onClick={() => selectPokemon(pd)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
                    <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={32} />
                    <span className="text-sm font-medium">{pd.name}</span>
                    <TypeBadge type={pd.type} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedPokemonData && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-gray-50">
              <PokemonSprite spriteId={selectedPokemonData.spriteId} name={selectedPokemonData.name} size={40} />
              <div className="flex-1">
                <span className="font-semibold text-sm">{selectedPokemonData.name}</span>
                <div className="flex gap-1"><TypeBadge type={selectedPokemonData.type} /></div>
              </div>
              {selectedPlayer && isCatch && (
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={addNewPokemon} onChange={e => setAddNewPokemon(e.target.checked)} />
                  Add to Pokédex
                </label>
              )}
            </div>
          )}

          {/* Show player's Pokemon for selection when leveling */}
          {selectedPlayerId && !isCatch && playerPokemon.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">Or pick from {selectedPlayer?.name}'s Pokémon:</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {playerPokemon.map(owned => {
                  const pd2 = getPokemonById(owned.pokemonDataId);
                  if (!pd2) return null;
                  return (
                    <button
                      key={owned.id}
                      onClick={() => selectPokemon(pd2)}
                      className="flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 min-w-[60px] transition-all"
                      style={{ borderColor: selectedPokemonData?.id === pd2.id ? '#CC0000' : '#E2E8F0' }}
                    >
                      <PokemonSprite spriteId={pd2.spriteId} name={pd2.name} size={40} />
                      <span className="text-xs">{pd2.name}</span>
                      <LevelBadge level={owned.level} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </PokeCard>

        {/* Notes */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">NOTES (Optional)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any notes about this game..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none resize-none"
          />
        </PokeCard>

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl font-bold text-white text-base active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #CC0000, #FF4444)', boxShadow: '0 4px 15px rgba(204,0,0,0.3)' }}
        >
          Log Result ✓
        </button>
      </div>
    </div>
  );
}
