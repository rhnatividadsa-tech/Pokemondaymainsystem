import { useMemo, useState } from 'react';
import { POKEMON_DATABASE, getSpriteUrl, getTypeColor } from '../../../shared/data/pokemonData';

type ResultPayload = {
  playerName: string;
  pokemonName: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
};

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [targetIndex, setTargetIndex] = useState(0);
  const [caught, setCaught] = useState(false);

  const target = POKEMON_DATABASE[targetIndex];
  const colors = getTypeColor(target.type);

  const payload = useMemo<ResultPayload>(() => ({
    playerName: playerName || 'Trainer',
    pokemonName: target.name,
    gameName: 'PokeReflex',
    result: caught ? 'caught' : 'encountered',
    levelGain: caught ? 1 : 0,
    coinsEarned: caught ? 20 : 5,
    sourceSystem: 'catching-subsystem',
  }), [caught, playerName, target.name]);

  function nextEncounter() {
    setCaught(false);
    setTargetIndex(index => (index + 1) % POKEMON_DATABASE.length);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-4 p-4 md:grid-cols-[1fr_380px] md:items-center">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200">
          <p className="text-xs font-bold uppercase text-slate-500">Subsystem 1 mini games</p>
          <h1 className="mt-1 text-3xl font-black">Catching Subsystem</h1>

          <label className="mt-6 grid gap-2 text-sm font-bold text-slate-700">
            Trainer
            <input
              className="rounded-lg border border-slate-300 px-3 py-3 text-base font-medium outline-none focus:border-blue-500"
              value={playerName}
              onChange={event => setPlayerName(event.target.value)}
              placeholder="Ash"
            />
          </label>

          <div
            className="mt-5 grid place-items-center rounded-lg border p-8"
            style={{ borderColor: colors.border, background: colors.bg }}
          >
            <img className="h-40 w-40 image-rendering-pixelated" src={getSpriteUrl(target.spriteId)} alt="" />
            <h2 className="text-2xl font-black">{target.name}</h2>
            <p className="font-bold" style={{ color: colors.text }}>
              #{target.id} · {target.type} · {target.region}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              className="rounded-lg bg-red-600 px-4 py-3 font-black text-white"
              type="button"
              onClick={() => setCaught(true)}
            >
              Catch
            </button>
            <button
              className="rounded-lg bg-slate-900 px-4 py-3 font-black text-white"
              type="button"
              onClick={nextEncounter}
            >
              Next
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200">
          <h2 className="text-lg font-black">Result Payload</h2>
          <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
