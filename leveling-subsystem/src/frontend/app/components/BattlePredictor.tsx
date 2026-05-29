import { useState } from 'react';
import { CharmanderIllustration } from './pokemon-illustrations/CharmanderIllustration';
import { SquirtleIllustration } from './pokemon-illustrations/SquirtleIllustration';
import { Flame, Droplet } from 'lucide-react';
import { ResultPopup } from './ResultPopup';

interface BattlePredictorProps {
  selectedPokemon: {
    name: string;
    level: number;
  } | null;
}

export function BattlePredictor({ selectedPokemon }: BattlePredictorProps) {
  if (!selectedPokemon) return null;

  const [selectedAnswer, setSelectedAnswer] = useState<'YES' | 'NO' | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer) {
      setShowResult(true);
    }
  };

  const handleClosePopup = () => {
    setShowResult(false);
    setSelectedAnswer(null);
  };

  const isCorrect = selectedAnswer === 'YES';

  return (
    <div>
      <div className="bg-white rounded-3xl p-8 border-4 border-[#EF4444] shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl text-center mb-8 text-gray-800">Battle Scenario</h2>

        {/* Battle Cards */}
        <div className="grid grid-cols-3 gap-6 items-center mb-8">
          {/* Charmander */}
          <div className="bg-white rounded-2xl border-2 border-[#EF4444] p-6">
            <p className="text-sm text-gray-600 text-center mb-2">Opponent</p>
            <h3 className="text-2xl text-center mb-4">Charmander</h3>
            <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4">
              <CharmanderIllustration />
            </div>
            <div className="bg-[#EF4444] text-white px-4 py-2 rounded-2xl flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" />
              <span>Fire Type</span>
            </div>
          </div>

          {/* VS */}
          <div className="flex justify-center">
            <div className="bg-[#2563EB] rounded-full w-20 h-20 flex items-center justify-center">
              <span className="text-3xl text-white">VS</span>
            </div>
          </div>

          {/* Squirtle */}
          <div className="bg-white rounded-2xl border-2 border-[#2563EB] p-6">
            <p className="text-sm text-gray-600 text-center mb-2">Challenger</p>
            <h3 className="text-2xl text-center mb-4">Squirtle</h3>
            <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4">
              <SquirtleIllustration />
            </div>
            <div className="bg-[#2563EB] text-white px-4 py-2 rounded-2xl flex items-center justify-center gap-2">
              <Droplet className="w-4 h-4" />
              <span>Water Type</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-[#F8FAFC] rounded-2xl p-6 mb-6 border-2 border-gray-200">
          <h3 className="text-xl text-center text-gray-800">
            Will Squirtle likely win based on type advantage?
          </h3>
        </div>

        {/* Answer Buttons */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => setSelectedAnswer('YES')}
            className={`min-w-32 px-12 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
              selectedAnswer === 'YES'
                ? 'bg-[#10B981] text-white border-[#10B981] hover:bg-green-700'
                : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-gray-50'
            }`}
          >
            YES
          </button>
          <button
            onClick={() => setSelectedAnswer('NO')}
            className={`min-w-32 px-12 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
              selectedAnswer === 'NO'
                ? 'bg-[#EF4444] text-white border-[#EF4444] hover:bg-red-700'
                : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-gray-50'
            }`}
          >
            NO
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <button
            disabled={!selectedAnswer}
            onClick={handleSubmit}
            className={`px-12 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
              selectedAnswer
                ? 'bg-[#2563EB] text-white border-[#2563EB] hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
            }`}
          >
            Submit Answer
          </button>
        </div>

        {showResult && <ResultPopup isCorrect={isCorrect} onClose={handleClosePopup} />}
      </div>
    </div>
  );
}
