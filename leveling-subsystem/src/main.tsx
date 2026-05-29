import { createRoot } from 'react-dom/client';
import { Activity, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { POKEMON_DATABASE, getSpriteUrl } from '../../shared/data/pokemonData';
import './styles/index.css';

type Result = {
  playerName: string;
  pokemonName: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
};

function App() {
  const [playerName, setPlayerName] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(POKEMON_DATABASE[0].name);
  const [score, setScore] = useState(0);

  const result = useMemo<Result>(() => {
    const levelGain = Math.min(5, Math.floor(score / 20));
    return {
      playerName: playerName || 'Trainer',
      pokemonName: selectedPokemon,
      gameName: 'Type Training',
      result: score >= 60 ? 'completed' : 'practice',
      levelGain,
      coinsEarned: levelGain * 10,
      sourceSystem: 'leveling-subsystem',
    };
  }, [playerName, selectedPokemon, score]);

  const pokemon = POKEMON_DATABASE.find(item => item.name === selectedPokemon) ?? POKEMON_DATABASE[0];

  return (
    <main className="app-shell">
      <section className="panel training-panel">
        <div className="title-row">
          <Activity size={24} />
          <div>
            <p className="eyebrow">Subsystem 2 mini games</p>
            <h1>Leveling Subsystem</h1>
          </div>
        </div>

        <label>
          Trainer
          <input value={playerName} onChange={event => setPlayerName(event.target.value)} placeholder="Ash" />
        </label>

        <label>
          Pokémon
          <select value={selectedPokemon} onChange={event => setSelectedPokemon(event.target.value)}>
            {POKEMON_DATABASE.map(item => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="score-row">
          <button type="button" onClick={() => setScore(value => Math.max(0, value - 10))}>
            -10
          </button>
          <strong>{score}</strong>
          <button type="button" onClick={() => setScore(value => Math.min(100, value + 10))}>
            +10
          </button>
        </div>
      </section>

      <section className="panel result-panel">
        <img src={getSpriteUrl(pokemon.spriteId)} alt="" />
        <div className="title-row">
          <Trophy size={22} />
          <h2>Result Payload</h2>
        </div>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
