import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { StartPage } from './components/StartPage';
import { Dashboard } from './components/Dashboard';
import { StarterSelection } from './components/StarterSelection';
import { Pokedex } from './components/Pokedex';
import { PokemonStore } from './components/PokemonStore';
import { Inventory } from './components/Inventory';
import { EvolutionPage } from './components/EvolutionPage';
import { GameHistory } from './components/GameHistory';
import { FacilitatorLog } from './components/FacilitatorLog';
import { ResultReceiver } from './components/ResultReceiver';
import { FloatingParticles } from './components/FloatingParticles';

type Page =
  | 'start'
  | 'dashboard'
  | 'starter'
  | 'pokedex'
  | 'store'
  | 'inventory'
  | 'evolution'
  | 'history'
  | 'facilitator'
  | 'subsystem';

const NAV_ITEMS: { page: Page; icon: string; label: string }[] = [
  { page: 'dashboard', icon: '🏠', label: 'Home' },
  { page: 'pokedex', icon: '📔', label: 'Dex' },
  { page: 'store', icon: '🛒', label: 'Store' },
  { page: 'inventory', icon: '🎒', label: 'Bag' },
  { page: 'history', icon: '📜', label: 'Log' },
];

export default function App() {
  const store = useGameStore();
  const { currentPlayer } = store;
  const [currentPage, setCurrentPage] = useState<Page>(() => (store.state.currentPlayerId ? 'dashboard' : 'start'));

  function navigate(p: Page) {
    setCurrentPage(p);
    window.scrollTo(0, 0);
  }

  function handleStart(name: string) {
    store.findOrCreatePlayer(name);
    setCurrentPage('dashboard');
  }

  function handleLogout() {
    store.logout();
    setCurrentPage('start');
  }

  function handleSelectStarter(pokemonDataId: string, pokemonName: string) {
    if (!currentPlayer) return;
    store.setStarterPokemon(currentPlayer.id, pokemonDataId, pokemonName);
    navigate('dashboard');
  }

  function handleBuyItem(itemName: string, price: number): boolean {
    if (!currentPlayer) return false;
    return store.buyItem(currentPlayer.id, itemName, price);
  }

  function handleEvolve(ownedId: string, newPokemonDataId: string, newName: string, stoneName: string): boolean {
    if (!currentPlayer) return false;
    return store.evolvePokemon(currentPlayer.id, ownedId, newPokemonDataId, newName, stoneName);
  }

  function handleUseRareCandy(ownedId: string, pokemonName: string): boolean {
    if (!currentPlayer) return false;
    return store.useRareCandy(currentPlayer.id, ownedId, pokemonName);
  }

  function handleFacilitatorLog(
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
  ) {
    if (addNewPokemon && pokemonDataId) {
      const source = gameName.toLowerCase().includes('irl') ? 'IRL Catch' as const : 'Manual Log' as const;
      store.addPokemonToPlayer(playerId, pokemonDataId, source, coinsEarned, gameName, notes || undefined);
    } else if (ownedId && (levelGain > 0 || coinsEarned > 0)) {
      store.updatePokemonLevel(playerId, ownedId, levelGain, coinsEarned, gameName, result, sourceSystem, notes || undefined);
    } else if (coinsEarned > 0) {
      // Coins only — use a dummy ownedId path; store handles missing gracefully via history
      store.updatePokemonLevel(playerId, '', levelGain, coinsEarned, gameName, result, sourceSystem, notes || undefined);
    }
  }

  const playerPokemon = currentPlayer ? store.getPlayerPokemon(currentPlayer.id) : [];
  const playerInventory = currentPlayer ? store.getPlayerInventory(currentPlayer.id) : [];
  const playerHistory = currentPlayer ? store.getPlayerHistory(currentPlayer.id) : [];
  const showNav = !!currentPlayer && currentPage !== 'start';

  return (
    <div
      className="flex items-start justify-center"
      style={{ background: '#E2E8F0', minHeight: '100vh' }}
    >
      {/* Phone shell */}
      <div
        className="relative flex flex-col w-full"
        style={{
          maxWidth: 430,
          minHeight: '100vh',
          background: '#F8FAFC',
          boxShadow: '0 0 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Floating particles background */}
        {currentPage !== 'start' && <FloatingParticles />}

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{ paddingBottom: showNav ? 64 : 0, zIndex: 10 }}
        >
          {currentPage === 'start' && (
            <StartPage onStart={handleStart} />
          )}

          {currentPage === 'dashboard' && currentPlayer && (
            <Dashboard
              player={currentPlayer}
              ownedPokemon={playerPokemon}
              onNavigate={navigate}
              onLogout={handleLogout}
            />
          )}

          {currentPage === 'starter' && currentPlayer && (
            <StarterSelection
              player={currentPlayer}
              onSelect={handleSelectStarter}
              onBack={() => navigate('dashboard')}
              alreadyHasStarter={!!currentPlayer.starterPokemonId}
              currentStarterId={currentPlayer.starterPokemonId}
            />
          )}

          {currentPage === 'pokedex' && currentPlayer && (
            <Pokedex
              ownedPokemon={playerPokemon}
              onBack={() => navigate('dashboard')}
            />
          )}

          {currentPage === 'store' && currentPlayer && (
            <PokemonStore
              player={currentPlayer}
              onBuy={handleBuyItem}
              onBack={() => navigate('dashboard')}
            />
          )}

          {currentPage === 'inventory' && currentPlayer && (
            <Inventory
              items={playerInventory}
              ownedPokemon={playerPokemon}
              playerName={currentPlayer.name}
              onUseRareCandy={handleUseRareCandy}
              onBack={() => navigate('dashboard')}
            />
          )}

          {currentPage === 'evolution' && currentPlayer && (
            <EvolutionPage
              ownedPokemon={playerPokemon}
              inventory={playerInventory}
              onEvolve={handleEvolve}
              onBack={() => navigate('dashboard')}
            />
          )}

          {currentPage === 'history' && currentPlayer && (
            <GameHistory
              history={playerHistory}
              playerName={currentPlayer.name}
              onBack={() => navigate('dashboard')}
            />
          )}

          {currentPage === 'facilitator' && (
            <FacilitatorLog
              players={store.state.players}
              allOwnedPokemon={store.state.ownedPokemon}
              onLogResult={handleFacilitatorLog}
              onBack={() => navigate('dashboard')}
            />
          )}

          {currentPage === 'subsystem' && (
            <ResultReceiver
              onProcess={store.processSubsystemResult}
              onBack={() => navigate('dashboard')}
            />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        {showNav && (
          <div
            className="fixed bottom-0 flex border-t"
            style={{
              width: '100%',
              maxWidth: 430,
              background: '#fff',
              borderColor: '#E2E8F0',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
              zIndex: 50,
            }}
          >
            {NAV_ITEMS.map(item => {
              const active = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => navigate(item.page)}
                  className="relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 "
                  style={{ color: active ? '#CC0000' : '#94A3B8' }}
                >
                  {active && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full "
                      style={{ background: '#CC0000' }}
                    />
                  )}
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.625rem', fontWeight: active ? 700 : 500 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
