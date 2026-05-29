import { useState, useEffect } from 'react';
import { Grid3x3, Trophy, TrendingUp, Coins } from 'lucide-react';
import { MemoryCard } from './MemoryCard';
import { MatchResultCard } from './MatchResultCard';
import { CharmanderIllustration } from './pokemon-illustrations/CharmanderIllustration';
import { SquirtleIllustration } from './pokemon-illustrations/SquirtleIllustration';
import { BulbasaurIllustration } from './pokemon-illustrations/BulbasaurIllustration';
import { PikachuIllustration } from './pokemon-illustrations/PikachuIllustration';

interface MatchThePokemonProps {
  selectedPokemon: {
    name: string;
    level: number;
  } | null;
}

export interface Card {
  id: number;
  type: 'pokemon' | 'symbol';
  name: string;
  pairId: number;
  content: JSX.Element;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MatchThePokemon({ selectedPokemon }: MatchThePokemonProps) {
  if (!selectedPokemon) return null;

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Initialize cards
  useEffect(() => {
    const pairs = [
      {
        pairId: 1,
        pokemon: { name: 'Charmander', content: <CharmanderIllustration /> },
        symbol: { name: 'Fire', content: <FireSymbol /> }
      },
      {
        pairId: 2,
        pokemon: { name: 'Squirtle', content: <SquirtleIllustration /> },
        symbol: { name: 'Water', content: <WaterSymbol /> }
      },
      {
        pairId: 3,
        pokemon: { name: 'Bulbasaur', content: <BulbasaurIllustration /> },
        symbol: { name: 'Grass', content: <GrassSymbol /> }
      },
      {
        pairId: 4,
        pokemon: { name: 'Pikachu', content: <PikachuIllustration /> },
        symbol: { name: 'Thunder', content: <ThunderSymbol /> }
      }
    ];

    const cardList: Card[] = [];
    pairs.forEach((pair, index) => {
      cardList.push({
        id: index * 2,
        type: 'pokemon',
        name: pair.pokemon.name,
        pairId: pair.pairId,
        content: pair.pokemon.content,
        isFlipped: false,
        isMatched: false
      });
      cardList.push({
        id: index * 2 + 1,
        type: 'symbol',
        name: pair.symbol.name,
        pairId: pair.pairId,
        content: pair.symbol.content,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle cards
    const shuffled = cardList.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  const handleCardClick = (cardId: number) => {
    // Don't allow flipping if already 2 cards are flipped or card is already matched
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped || flippedCards.length >= 2) return;

    // Flip the card
    const updatedCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);
    setFlippedCards([...flippedCards, cardId]);

    // Check for match if 2 cards are flipped
    if (flippedCards.length === 1) {
      const firstCard = updatedCards.find(c => c.id === flippedCards[0]);
      const secondCard = updatedCards.find(c => c.id === cardId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 600);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === flippedCards[0] || c.id === cardId
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Check if game is complete
  useEffect(() => {
    if (matchedPairs === 4 && cards.length > 0) {
      setTimeout(() => {
        setShowResult(true);
      }, 500);
    }
  }, [matchedPairs, cards]);

  const handleCloseResult = () => {
    setShowResult(false);
    setMatchedPairs(0);
    setFlippedCards([]);
    // Reset and reshuffle cards
    const resetCards = cards.map(c => ({ ...c, isFlipped: false, isMatched: false }));
    const shuffled = resetCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  };

  const remainingPairs = 4 - matchedPairs;

  return (
    <div className="max-w-6xl mx-auto mt-16">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-purple-600 mb-12">
        <h1 className="text-5xl text-center mb-8 text-purple-600">
          Match That Pokemon
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
      <div className="bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded-3xl shadow-2xl p-10 border-8 border-yellow-400">
        {/* Instructions */}
        <div className="bg-white rounded-3xl p-6 border-4 border-pink-400 shadow-xl mb-8">
          <p className="text-2xl text-center text-gray-800">
            Flip cards and find matching pairs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-4 border-green-400 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <Grid3x3 className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="text-xl text-gray-600">Matched Pairs</p>
                <p className="text-4xl text-green-600">{matchedPairs} / 4</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-4 border-orange-400 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="text-xl text-gray-600">Remaining Pairs</p>
                <p className="text-4xl text-orange-600">{remainingPairs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board - 4x2 Grid */}
        <div className="bg-white rounded-3xl p-8 border-4 border-purple-400 shadow-xl mb-8">
          <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
            {cards.map((card) => (
              <MemoryCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card.id)}
              />
            ))}
          </div>
        </div>

        {/* Reward Rules */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-orange-400 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-orange-600" />
            <h3 className="text-3xl text-orange-800">Reward Rules</h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-green-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3 text-center">4 Matched Pairs:</p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="text-xl text-blue-600">+10 Levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-600" />
                  <span className="text-xl text-yellow-600">+15 Coins</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-blue-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3 text-center">2-3 Matched Pairs:</p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="text-xl text-blue-600">+3 Levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-600" />
                  <span className="text-xl text-yellow-600">+5 Coins</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3 text-center">0-1 Matched Pairs:</p>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xl text-gray-600">No Reward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result Card */}
        {showResult && (
          <MatchResultCard
            matchedPairs={matchedPairs}
            onClose={handleCloseResult}
          />
        )}
      </div>
    </div>
  );
}

// Symbol Components
function FireSymbol() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M 50 10 Q 60 30 55 45 Q 70 40 65 60 Q 70 70 60 80 Q 50 90 40 80 Q 30 70 35 60 Q 30 40 45 45 Q 40 30 50 10" fill="#FF6B35" />
      <path d="M 50 25 Q 55 35 52 45 Q 60 42 57 55 Q 60 62 53 68 Q 50 72 47 68 Q 40 62 43 55 Q 40 42 48 45 Q 45 35 50 25" fill="#FFD93D" />
    </svg>
  );
}

function WaterSymbol() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M 50 15 Q 35 40 35 55 Q 35 75 50 85 Q 65 75 65 55 Q 65 40 50 15" fill="#4A90E2" />
      <path d="M 50 25 Q 40 45 40 55 Q 40 68 50 75 Q 60 68 60 55 Q 60 45 50 25" fill="#6BB6FF" />
      <ellipse cx="48" cy="50" rx="4" ry="6" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

function GrassSymbol() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M 50 80 Q 30 60 35 30 Q 38 15 45 20 Q 48 35 50 50" fill="#78C850" />
      <path d="M 50 80 Q 45 55 48 35 Q 50 20 55 25 Q 52 40 50 55" fill="#A8D890" />
      <path d="M 50 80 Q 70 60 65 30 Q 62 15 55 20 Q 52 35 50 50" fill="#48D0B0" />
      <ellipse cx="50" cy="80" rx="8" ry="4" fill="#8B4513" />
    </svg>
  );
}

function ThunderSymbol() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M 55 10 L 40 45 L 55 45 L 35 85 L 60 50 L 48 50 L 55 10" fill="#FFD700" stroke="#FF8C00" strokeWidth="2" />
      <path d="M 55 15 L 43 42 L 52 42 L 40 72 L 58 48 L 50 48 L 55 15" fill="#FFEB3B" />
    </svg>
  );
}
