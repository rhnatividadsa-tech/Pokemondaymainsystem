import { useState } from 'react';
import { PikachuIllustration } from './pokemon-illustrations/PikachuIllustration';
import { HelpCircle, Trophy, TrendingUp, Coins, Star, Volume2, VolumeX } from 'lucide-react';
import { GuessResultCard } from './GuessResultCard';

interface GuessThePokemonProps {
  selectedPokemon: {
    name: string;
    level: number;
  } | null;
}

export function GuessThePokemon({ selectedPokemon }: GuessThePokemonProps) {
  if (!selectedPokemon) return null;

  const [pokemonName, setPokemonName] = useState('');
  const [pokemonType, setPokemonType] = useState('');
  const [counterType, setCounterType] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const pokemonSoundUrl = 'https://www.youtube.com/embed/WIIufKSuduc?autoplay=1&loop=1&playlist=WIIufKSuduc&controls=0&modestbranding=1&rel=0';

  // Correct answers for this example
  const correctAnswers = {
    name: 'Pikachu',
    type: 'Electric',
    counter: 'Ground'
  };

  const handleSubmit = () => {
    let totalScore = 0;

    // Check Pokemon Name (5 points)
    if (pokemonName.toLowerCase().trim() === correctAnswers.name.toLowerCase()) {
      totalScore += 5;
    }

    // Check Pokemon Type (3 points)
    if (pokemonType.toLowerCase().trim() === correctAnswers.type.toLowerCase()) {
      totalScore += 3;
    }

    // Check Counter Type (2 points)
    if (counterType.toLowerCase().trim() === correctAnswers.counter.toLowerCase()) {
      totalScore += 2;
    }

    setScore(totalScore);
    setShowResult(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setPokemonName('');
    setPokemonType('');
    setCounterType('');
    setScore(0);
  };

  const isFormValid = pokemonName.trim() && pokemonType.trim() && counterType.trim();

  return (
    <div className="max-w-6xl mx-auto mt-16">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-blue-600 mb-12">
        <h1 className="text-5xl text-center mb-8 text-blue-600">
          Guess That Pokemon
        </h1>

        {/* Selected Pokemon Display */}
        <div className="text-center">
          <h2 className="text-2xl text-gray-700 mb-4">Selected Pokemon:</h2>
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-lg">
            <span className="text-3xl">{selectedPokemon.name}</span>
            <span className="text-2xl">-</span>
            <span className="text-3xl">Level {selectedPokemon.level}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 rounded-3xl shadow-2xl p-10 border-8 border-yellow-400">
        <h2 className="text-3xl text-center mb-10 text-gray-800 flex items-center justify-center gap-3">
          <HelpCircle className="w-10 h-10 text-blue-600" />
          Game Area
        </h2>

        {/* Sound Toggle */}
        <div className="bg-white rounded-3xl p-6 border-4 border-blue-400 shadow-xl mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                {isSoundPlaying ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-2xl text-gray-800">Pokemon Sound</h3>
                <p className="text-lg text-gray-600">Play the sound clue for this round</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSoundPlaying((playing) => !playing)}
              className={`inline-flex items-center justify-center gap-3 min-w-44 px-8 py-4 text-xl rounded-full transition-all duration-300 border-4 shadow-lg ${
                isSoundPlaying
                  ? 'bg-red-500 text-white border-red-700 hover:bg-red-600'
                  : 'bg-blue-500 text-white border-blue-700 hover:bg-blue-600 hover:scale-105'
              }`}
            >
              {isSoundPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              {isSoundPlaying ? 'Stop Sound' : 'Play Sound'}
            </button>
          </div>

          {isSoundPlaying && (
            <iframe
              className="absolute w-px h-px opacity-0 pointer-events-none"
              src={pokemonSoundUrl}
              title="Guess That Pokemon sound"
              allow="autoplay; encrypted-media"
            />
          )}
        </div>

        {/* Blurred Pokemon Silhouette */}
        <div className="bg-white rounded-3xl p-8 border-4 border-purple-400 shadow-xl mb-10">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-6">
            <div className="max-w-md mx-auto aspect-square flex items-center justify-center">
              <div className="w-full h-full blur-lg opacity-70">
                <PikachuIllustration />
              </div>
            </div>
          </div>

          <h3 className="text-4xl text-center text-gray-800">
            Guess the Pokemon
          </h3>
        </div>

        {/* Input Fields */}
        <div className="bg-white rounded-3xl p-8 border-4 border-blue-400 shadow-xl mb-10">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {/* Pokemon Name Input */}
            <div>
              <label className="block text-2xl text-gray-700 mb-3">
                Pokemon Name
              </label>
              <input
                type="text"
                value={pokemonName}
                onChange={(e) => setPokemonName(e.target.value)}
                placeholder="Enter Pokemon name..."
                className="w-full px-6 py-4 text-xl border-4 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 shadow-md"
              />
            </div>

            {/* Pokemon Type Input */}
            <div>
              <label className="block text-2xl text-gray-700 mb-3">
                Pokemon Type
              </label>
              <input
                type="text"
                value={pokemonType}
                onChange={(e) => setPokemonType(e.target.value)}
                placeholder="Enter Pokemon type..."
                className="w-full px-6 py-4 text-xl border-4 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 shadow-md"
              />
            </div>

            {/* Counter Type Input */}
            <div>
              <label className="block text-2xl text-gray-700 mb-3">
                Counter Type
              </label>
              <input
                type="text"
                value={counterType}
                onChange={(e) => setCounterType(e.target.value)}
                placeholder="Enter counter type..."
                className="w-full px-6 py-4 text-xl border-4 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 shadow-md"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-20 py-6 text-3xl rounded-full transition-all duration-300 border-6 shadow-2xl ${
                isFormValid
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-700 hover:scale-105 hover:shadow-blue-400/50'
                  : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              Submit Guess
            </button>
          </div>
        </div>

        {/* Scoring Section */}
        <div className="bg-white rounded-3xl p-8 border-4 border-yellow-400 shadow-xl mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Star className="w-10 h-10 text-yellow-600" />
            <h3 className="text-3xl text-gray-800">Scoring</h3>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 text-center">
              <p className="text-xl text-gray-700 mb-2">Pokemon Name</p>
              <p className="text-4xl text-blue-600">5 Points</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 text-center">
              <p className="text-xl text-gray-700 mb-2">Pokemon Type</p>
              <p className="text-4xl text-purple-600">3 Points</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border-2 border-pink-300 text-center">
              <p className="text-xl text-gray-700 mb-2">Counter Type</p>
              <p className="text-4xl text-pink-600">2 Points</p>
            </div>
          </div>
        </div>

        {/* Reward Rules */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-orange-400 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-orange-600" />
            <h3 className="text-3xl text-orange-800">Reward Rules</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-green-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3">8-10 Points:</p>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="text-xl text-blue-600">+10 Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-600" />
                <span className="text-xl text-yellow-600">+15 Coins</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-blue-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3">4-7 Points:</p>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="text-xl text-blue-600">+5 Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-600" />
                <span className="text-xl text-yellow-600">+8 Coins</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-yellow-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3">1-3 Points:</p>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="text-xl text-blue-600">+1 Level</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-600" />
                <span className="text-xl text-yellow-600">+3 Coins</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3">0 Points:</p>
              <div className="flex items-center gap-2">
                <span className="text-xl text-gray-600">No Reward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result Card */}
        {showResult && (
          <GuessResultCard
            score={score}
            onClose={handleCloseResult}
          />
        )}
      </div>
    </div>
  );
}
