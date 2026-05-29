import { useState } from 'react';
import { BattlePredictor } from './components/BattlePredictor';
import { GuessThePokemon } from './components/GuessThePokemon';
import { MatchThePokemon } from './components/MatchThePokemon';
import { BattleResultLogger } from './components/BattleResultLogger';
import { CharmanderIllustration } from './components/pokemon-illustrations/CharmanderIllustration';
import { SquirtleIllustration } from './components/pokemon-illustrations/SquirtleIllustration';
import { PikachuIllustration } from './components/pokemon-illustrations/PikachuIllustration';
import { BulbasaurIllustration } from './components/pokemon-illustrations/BulbasaurIllustration';
import { Coins, TrendingUp, Swords, HelpCircle, Grid3x3, Scroll, Check, Sparkles } from 'lucide-react';

type Screen = 'trainer-name' | 'pokemon-selection' | 'mini-games';
type Tab = 'battle-predictor' | 'guess-pokemon' | 'match-pokemon' | 'battle-logger';

interface Pokemon {
  id: number;
  name: string;
  level: number;
  coins: number;
  illustration: JSX.Element;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('trainer-name');
  const [playerName, setPlayerName] = useState('');
  const [trainerPokemon, setTrainerPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('battle-predictor');

  // Mock trainer database
  const trainerDatabase: Record<string, Pokemon[]> = {
    'Ash': [
      { id: 1, name: 'Pikachu', level: 25, coins: 150, illustration: <PikachuIllustration /> },
      { id: 2, name: 'Charmander', level: 15, coins: 80, illustration: <CharmanderIllustration /> }
    ],
    'Misty': [
      { id: 3, name: 'Squirtle', level: 20, coins: 120, illustration: <SquirtleIllustration /> }
    ],
    'Brock': [
      { id: 4, name: 'Bulbasaur', level: 18, coins: 100, illustration: <BulbasaurIllustration /> }
    ],
    'Guest': [
      { id: 1, name: 'Charmander', level: 15, coins: 100, illustration: <CharmanderIllustration /> },
      { id: 2, name: 'Squirtle', level: 8, coins: 50, illustration: <SquirtleIllustration /> },
      { id: 3, name: 'Pikachu', level: 12, coins: 75, illustration: <PikachuIllustration /> },
      { id: 4, name: 'Bulbasaur', level: 10, coins: 60, illustration: <BulbasaurIllustration /> }
    ]
  };

  const handleTrainerNameSubmit = () => {
    if (!playerName.trim()) return;

    // Load trainer data
    const pokemon = trainerDatabase[playerName] || trainerDatabase['Guest'];
    setTrainerPokemon(pokemon);
    setCurrentScreen('pokemon-selection');
  };

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    setCurrentScreen('mini-games');
    setActiveTab('battle-predictor');
  };

  const handleBackToPokemonSelection = () => {
    setSelectedPokemon(null);
    setCurrentScreen('pokemon-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-yellow-300 to-red-400 p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-8 border-white"></div>
        <div className="absolute top-10 left-10 w-32 h-16 border-b-8 border-white"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full border-8 border-white"></div>
        <div className="absolute bottom-20 right-20 w-40 h-20 border-b-8 border-white"></div>
        <div className="absolute top-1/3 right-10 w-24 h-24 rounded-full border-8 border-white"></div>
        <div className="absolute top-1/3 right-10 w-24 h-12 border-b-8 border-white"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with Pokeball logo */}
        <div className="relative mb-8">
          {/* Decorative Pokeballs */}
          <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-white border-4 border-gray-800 shadow-lg">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-gray-800"></div>
          </div>
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white border-4 border-gray-800 shadow-lg">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-gray-800"></div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-4 border-[#2563EB] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-red-200/20 to-transparent rounded-full blur-2xl"></div>

            <div className="absolute top-4 left-4 flex gap-1">
              <div className="w-2 h-2 bg-[#EF4444] rounded-full"></div>
              <div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div>
              <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
            </div>
            <div className="absolute top-4 right-4 flex gap-1">
              <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
              <div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div>
              <div className="w-2 h-2 bg-[#EF4444] rounded-full"></div>
            </div>

            <h1 className="text-5xl text-center bg-gradient-to-r from-[#EF4444] via-[#FBBF24] to-[#2563EB] bg-clip-text text-transparent mb-6 drop-shadow-sm font-bold relative z-10">
              Pokemon Training Grounds
            </h1>

            {currentScreen === 'trainer-name' && (
              <div className="flex gap-4 items-center justify-center">
                <input
                  type="text"
                  placeholder="Enter Trainer Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrainerNameSubmit()}
                  className="px-6 py-3 text-lg border-3 border-[#FBBF24] rounded-2xl focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white shadow-md"
                />
                <button
                  onClick={handleTrainerNameSubmit}
                  className="px-8 py-3 text-lg bg-[#2563EB] text-white hover:bg-blue-700 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
                >
                  Continue
                </button>
              </div>
            )}

            {currentScreen !== 'trainer-name' && (
              <div className="text-center">
                <p className="text-xl text-gray-700 relative z-10">
                  Trainer: <span className="font-bold text-[#2563EB]">{playerName || 'Guest'}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pokemon Selection Screen */}
        {currentScreen === 'pokemon-selection' && (
          <div className="bg-white rounded-3xl p-8 border-4 border-[#FBBF24] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-yellow-200/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl"></div>

            {/* Corner Pokeballs */}
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>
            <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">⭐</span>
              </div>
            </div>

            <h2 className="text-3xl text-center mb-2 text-gray-800 font-bold relative z-10">
              Choose a Pokemon to Level Up
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FBBF24] to-transparent mx-auto mb-8"></div>

            <div className={`grid gap-6 mb-8 relative z-10 ${
              trainerPokemon.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              trainerPokemon.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
              trainerPokemon.length === 3 ? 'grid-cols-3' :
              'grid-cols-4'
            }`}>
              {trainerPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  onClick={() => handlePokemonSelect(pokemon)}
                  className="relative bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer border-3 border-gray-200 hover:border-[#2563EB] shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Pokemon Illustration */}
                  <div className="relative mb-4 rounded-2xl overflow-hidden aspect-square p-4 bg-[#F8FAFC]">
                    {pokemon.illustration}
                  </div>

                  {/* Pokemon Name */}
                  <h3 className="text-2xl text-center mb-3 text-gray-800 font-medium">{pokemon.name}</h3>

                  {/* Current Level and Coins */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white px-4 py-2 rounded-full shadow-md">
                        <span className="text-sm">Level</span>
                        <span className="text-lg font-bold">{pokemon.level}</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#EF4444] text-white px-4 py-2 rounded-full shadow-md">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-medium">{pokemon.coins} Coins</span>
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePokemonSelect(pokemon);
                    }}
                    className="w-full px-8 py-3 text-lg bg-white text-[#2563EB] hover:bg-gray-50 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini Games Screen with Tab Navigation */}
        {currentScreen === 'mini-games' && selectedPokemon && (
          <>
            {/* Selected Pokemon Info Bar */}
            <div className="bg-white rounded-3xl p-6 border-4 border-[#2563EB] shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/20 to-transparent rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="text-2xl font-bold text-gray-800">
                    {selectedPokemon.name}
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white px-4 py-2 rounded-full shadow-md">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Level {selectedPokemon.level}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#EF4444] text-white px-4 py-2 rounded-full shadow-md">
                    <Coins className="w-5 h-5" />
                    <span className="font-medium">{selectedPokemon.coins} Coins</span>
                  </div>
                </div>
                <button
                  onClick={handleBackToPokemonSelection}
                  className="px-8 py-3 text-lg bg-white text-[#2563EB] hover:bg-gray-50 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
                >
                  ← Back to Pokemon
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-3xl p-2 border-4 border-gray-200 shadow-2xl">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'battle-predictor' as Tab, label: 'Battle Predictor', icon: <Swords className="w-6 h-6" />, color: '#EF4444' },
                  { id: 'guess-pokemon' as Tab, label: 'Guess That Pokemon', icon: <HelpCircle className="w-6 h-6" />, color: '#2563EB' },
                  { id: 'match-pokemon' as Tab, label: 'Match That Pokemon', icon: <Grid3x3 className="w-6 h-6" />, color: '#FBBF24' },
                  { id: 'battle-logger' as Tab, label: 'Battle Result Logger', icon: <Scroll className="w-6 h-6" />, color: '#8B5CF6' }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative rounded-2xl p-4 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br shadow-lg scale-105'
                          : 'bg-gray-50 hover:bg-gray-100 hover:scale-102'
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: tab.color,
                              boxShadow: `0 4px 20px ${tab.color}40`
                            }
                          : {}
                      }
                    >
                      {isActive && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse"
                          style={{ backgroundColor: tab.color }}
                        ></div>
                      )}

                      <div className="flex flex-col items-center gap-2">
                        <div className={`transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>
                          {tab.icon}
                        </div>
                        <span className={`text-sm text-center font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-700'}`}>
                          {tab.label}
                        </span>
                      </div>

                      {isActive && (
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full"
                          style={{ backgroundColor: 'white' }}
                        ></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'battle-predictor' && (
                <BattlePredictor selectedPokemon={selectedPokemon} />
              )}
              {activeTab === 'guess-pokemon' && (
                <GuessThePokemon selectedPokemon={selectedPokemon} />
              )}
              {activeTab === 'match-pokemon' && (
                <MatchThePokemon selectedPokemon={selectedPokemon} />
              )}
              {activeTab === 'battle-logger' && (
                <BattleResultLogger selectedPokemon={selectedPokemon} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
