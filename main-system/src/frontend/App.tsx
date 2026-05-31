import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { findOrCreatePlayer, getPlayerDashboardStats, saveStarterPokemon } from '../backend/playerService';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Backpack,
  BookOpen,
  Candy,
  CircleDollarSign,
  Flame,
  Home,
  KeyRound,
  Leaf,
  Link as LinkIcon,
  ScrollText,
  ShoppingCart,
  Sparkles,
  Star,
  Waves,
  Zap,
} from 'lucide-react-native';
import {
  POKEMON_DATABASE,
  PokemonData,
  STORE_ITEMS,
  StoreItem,
  getPokemonById,
  getSpriteUrl,
  getTypeColor,
} from '../../../shared/data/pokemonData';

const pokeballImg = require('./imports/image-2.png') as ImageSourcePropType;
const pokemonLogo = require('./imports/image-3.png') as ImageSourcePropType;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

type OwnedPokemon = {
  id: string;
  pokemonDataId: string;
  level: number;
  source: string;
};

type HistoryEntry = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

const STARTER_QUESTIONS = [
  {
    text: 'In a battle, you prefer to...',
    options: [
      { label: 'Rush in with full force 🔥', type: 'Fire' },
      { label: 'Outlast the opponent with patience 🌿', type: 'Grass' },
      { label: 'Stay flexible and find openings 💧', type: 'Water' },
    ],
  },
  {
    text: "What's your ideal vacation?",
    options: [
      { label: 'Volcanic island adventure 🌋', type: 'Fire' },
      { label: 'Dense forest exploration 🌲', type: 'Grass' },
      { label: 'Ocean cruise or surfing 🏄', type: 'Water' },
    ],
  },
  {
    text: 'Your biggest strength is...',
    options: [
      { label: 'Passion and raw determination 💪', type: 'Fire' },
      { label: 'Patience and careful strategy 🧠', type: 'Grass' },
      { label: 'Adaptability and staying calm 🌊', type: 'Water' },
    ],
  },
  {
    text: 'When facing a tough problem, you...',
    options: [
      { label: 'Attack it head-on immediately ⚡', type: 'Fire' },
      { label: 'Analyze every detail first 🔍', type: 'Grass' },
      { label: 'Go with the flow and improvise 🎯', type: 'Water' },
    ],
  },
  {
    text: 'Your favorite element is...',
    options: [
      { label: 'Fire — powerful and unstoppable 🔥', type: 'Fire' },
      { label: 'Nature — wise and enduring 🌿', type: 'Grass' },
      { label: 'Water — calm yet overwhelming 💧', type: 'Water' },
    ],
  },
];

const featureItems: { label: string; page: Page; Icon: any; color: string }[] = [
  { label: 'Pokédex', page: 'pokedex', Icon: BookOpen, color: '#2B6CB0' },
  { label: 'Starter', page: 'starter', Icon: Star, color: '#D69E2E' },
  { label: 'Store', page: 'store', Icon: ShoppingCart, color: '#276749' },
  { label: 'Inventory', page: 'inventory', Icon: Backpack, color: '#C05621' },
  { label: 'Evolution', page: 'evolution', Icon: Sparkles, color: '#805AD5' },
  { label: 'History', page: 'history', Icon: ScrollText, color: '#718096' },
  { label: 'Facilitator', page: 'facilitator', Icon: KeyRound, color: '#CC0000' },
  { label: 'Subsystem', page: 'subsystem', Icon: LinkIcon, color: '#1a1a2e' },
];

const navItems: { page: Page; Icon: any; label: string }[] = [
  { page: 'dashboard', Icon: Home, label: 'Home' },
  { page: 'pokedex', Icon: BookOpen, label: 'Dex' },
  { page: 'store', Icon: ShoppingCart, label: 'Store' },
  { page: 'inventory', Icon: Backpack, label: 'Bag' },
  { page: 'history', Icon: ScrollText, label: 'Log' },
];

export default function App() {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [page, setPage] = useState<Page>('start');
  const [coins, setCoins] = useState(100);
  const [ownedPokemon, setOwnedPokemon] = useState<OwnedPokemon[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const starter = useMemo(() => {
    const first = ownedPokemon.find(owned => owned.source === 'Starter');
    return first ? getPokemonById(first.pokemonDataId) ?? null : null;
  }, [ownedPokemon]);

  const totalLevels = ownedPokemon.reduce((sum, owned) => sum + owned.level, 0);
  const showNav = !!playerName && page !== 'start';

  function log(title: string, detail: string) {
    setHistory(current => [
      {
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        detail,
        createdAt: new Date().toLocaleString(),
      },
      ...current,
    ]);
  }

 function startJourney() {
  const trimmed = nameInput.trim();

  if (!trimmed) {
    setError('Please enter your trainer name!');
    return;
  }

  if (trimmed.length < 2) {
    setError('Name must be at least 2 characters.');
    return;
  }

  setError('');
  setIsStarting(true);

  setTimeout(() => {
    findOrCreatePlayer(trimmed)
      .then(async (player) => {
        const stats = await getPlayerDashboardStats(player.player_id);

        setPlayerName(player.player_name);
        setPlayerId(player.player_id);
        setCoins(player.coin_balance ?? 0);
        setOwnedPokemon(
          stats.pokedex.map((item) => ({
            id: item.pokedex_id,
            pokemonDataId: item.pokemon_id,
            level: item.level,
            source: item.source,
          }))
        );
        setPage('dashboard');
        log('Journey Started', `${player.player_name} began a Pokémon adventure.`);
      })
      .catch((error) => {
  console.error('Start journey error:', error);
  setError('Unable to start journey. Please try again.');
})
      .finally(() => {
        setIsStarting(false);
      });
  }, 1150);
}

  function chooseStarter(pokemon: PokemonData) {
  const hasStarter = ownedPokemon.some(owned => owned.source === 'Starter');

  if (hasStarter) {
    setPage('dashboard');
    return;
  }

  saveStarterPokemon(playerId, pokemon.id)
    .then((starterRecord) => {
      setOwnedPokemon(current => [
        ...current,
        {
          id: starterRecord.pokedex_id,
          pokemonDataId: starterRecord.pokemon_id,
          level: starterRecord.level,
          source: starterRecord.source,
        },
      ]);

      log('Starter Selection', `${playerName} selected ${pokemon.name}.`);
      setPage('dashboard');
    })
    .catch((error) => {
      console.error('Starter selection error:', error);
    });
}

  function buyItem(item: StoreItem) {
    if (coins < item.price) return;
    setCoins(current => current - item.price);
    setInventory(current => ({ ...current, [item.name]: (current[item.name] ?? 0) + 1 }));
    log('Pokémon Store', `${playerName} bought ${item.name}.`);
  }

  function useRareCandy(ownedId: string, pokemonName: string) {
    if ((inventory['Rare Candy'] ?? 0) < 1) return;
    setInventory(current => ({ ...current, 'Rare Candy': Math.max(0, (current['Rare Candy'] ?? 0) - 1) }));
    setOwnedPokemon(current =>
      current.map(owned => (owned.id === ownedId ? { ...owned, level: owned.level + 5 } : owned)),
    );
    log('Inventory', `${pokemonName} gained +5 levels from Rare Candy.`);
  }

  function evolvePokemon(owned: OwnedPokemon, nextId: string, stone: string) {
    if ((inventory[stone] ?? 0) < 1) return;
    const next = getPokemonById(nextId);
    if (!next) return;
    setInventory(current => ({ ...current, [stone]: Math.max(0, (current[stone] ?? 0) - 1) }));
    setOwnedPokemon(current =>
      current.map(item => (item.id === owned.id ? { ...item, pokemonDataId: nextId } : item)),
    );
    log('Evolution', `${playerName}'s Pokémon evolved into ${next.name}.`);
  }

  function switchTrainer() {
    setNameInput('');
    setError('');
    setPlayerName('');
    setPage('start');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={page === 'start' ? 'light' : 'dark'} />
      <View style={styles.phone}>
        {page === 'start' ? (
          <StartScreen
            name={nameInput}
            error={error}
            onNameChange={value => {
              setNameInput(value);
              setError('');
            }}
            onStart={startJourney}
            isStarting={isStarting}
          />
        ) : (
          <>
            {page !== 'dashboard' && (
              <Header title={titleForPage(page)} onBack={() => setPage('dashboard')} />
            )}

            {page === 'dashboard' && (
              <DashboardScreen
                playerName={playerName}
                coins={coins}
                ownedPokemon={ownedPokemon}
                totalLevels={totalLevels}
                starter={starter}
                onNavigate={setPage}
                onSwitchTrainer={switchTrainer}
              />
            )}

            {page === 'starter' && (
              <StarterScreen
                hasStarter={!!starter}
                starterId={starter?.id}
                onSelect={chooseStarter}
              />
            )}

            {page === 'pokedex' && <PokedexScreen ownedPokemon={ownedPokemon} />}

            {page === 'store' && (
              <StoreScreen coins={coins} inventory={inventory} onBuy={buyItem} />
            )}

            {page === 'inventory' && (
              <InventoryScreen
                inventory={inventory}
                ownedPokemon={ownedPokemon}
                onUseRareCandy={useRareCandy}
              />
            )}

            {page === 'evolution' && (
              <EvolutionScreen
                inventory={inventory}
                ownedPokemon={ownedPokemon}
                onEvolve={evolvePokemon}
              />
            )}

            {page === 'history' && <HistoryScreen history={history} />}

            {page === 'facilitator' && (
              <InfoScreen icon="🔑" title="Facilitator Log" message="Backend/API logging will connect here." />
            )}

            {page === 'subsystem' && (
              <InfoScreen icon="🔗" title="Subsystem Result Receiver" message="Subsystem payload processing will connect here." />
            )}

            {showNav && <BottomNav current={page} onNavigate={setPage} />}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function StartScreen({
  name,
  error,
  isStarting,
  onNameChange,
  onStart,
}: {
  name: string;
  error: string;
  isStarting: boolean;
  onNameChange: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <View style={styles.startScreen}>
      <FloatingText style={[styles.floatIcon, styles.floatOne]} delay={0}>⚡</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatTwo]} delay={500} reverse>🔥</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatThree]} delay={1000}>💧</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatFour]} delay={1500} reverse>🌿</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatFive]} delay={800}>✨</FloatingText>

      <FadeInView style={styles.logoArea}>
        <Image source={pokemonLogo} style={styles.logo} resizeMode="contain" />
        <SpinImage source={pokeballImg} style={styles.bigBall} />
        <Text style={styles.brandTitle}>PokéJourney</Text>
        <Text style={styles.brandSubtitle}>Begin your Pokémon adventure!</Text>
      </FadeInView>

      <FadeInView delay={180} style={styles.startCard}>
        <Text style={styles.muted}>Welcome, Trainer!</Text>
        <Text style={styles.startHeading}>Enter your name to start</Text>
        <Text style={styles.inputLabel}>Trainer Name</Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="e.g. Ash, Misty, Brock..."
          placeholderTextColor="#9CA3AF"
          maxLength={20}
          onSubmitEditing={onStart}
          style={[styles.input, error ? styles.inputError : null]}
          editable={!isStarting}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={[styles.startButton, isStarting && styles.disabledButton]} onPress={onStart} disabled={isStarting}>
          <Text style={styles.startButtonText}>{isStarting ? 'Starting Journey...' : 'Start Journey →'}</Text>
        </Pressable>
        <Text style={styles.hintText}>Returning trainer? Enter your name to continue your journey.</Text>
      </FadeInView>

      {isStarting && (
        <View style={styles.transitionOverlay}>
          <PokeballTransition />
        </View>
      )}
    </View>
  );
}

function DashboardScreen({
  playerName,
  coins,
  ownedPokemon,
  totalLevels,
  starter,
  onNavigate,
  onSwitchTrainer,
}: {
  playerName: string;
  coins: number;
  ownedPokemon: OwnedPokemon[];
  totalLevels: number;
  starter: PokemonData | null;
  onNavigate: (page: Page) => void;
  onSwitchTrainer: () => void;
}) {
  const starterOwned = starter ? ownedPokemon.find(owned => owned.pokemonDataId === starter.id) : null;

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <FadeInView>
      <Card style={styles.trainerCard}>
        <View style={styles.trainerHeader}>
          <View>
            <Text style={styles.trainerLabel}>Trainer</Text>
            <Text style={styles.trainerName}>{playerName}</Text>
          </View>
          <SpinImage source={pokeballImg} style={styles.headerBall} />
        </View>
        <View style={styles.statsRow}>
          <Stat label="Pokémon" value={ownedPokemon.length} />
          <Divider />
          <Stat label="Total Lvls" value={totalLevels} />
          <View style={styles.statSpacer} />
          <CoinDisplay coins={coins} />
        </View>
      </Card>
      </FadeInView>

      {starter && starterOwned ? (
        <FadeInView delay={120}>
        <Card style={styles.starterCard}>
          <Text style={styles.sectionLabel}>Your Starter</Text>
          <View style={styles.starterRow}>
            <View style={styles.spriteFrame}>
              <FloatingSprite pokemon={starter} size={70} />
            </View>
            <View style={styles.flexOne}>
              <View style={styles.nameRow}>
                <Text style={styles.cardTitle}>{starter.name}</Text>
                <LevelBadge level={starterOwned.level} />
              </View>
              <TypeBadge type={starter.type} />
              <Text style={styles.smallMuted}>{starter.region} Region</Text>
            </View>
          </View>
        </Card>
        </FadeInView>
      ) : (
        <FadeInView delay={120}>
          <Pressable style={styles.chooseStarterButton} onPress={() => onNavigate('starter')}>
            <Text style={styles.chooseStarterText}>⭐ Choose your Starter Pokémon</Text>
          </Pressable>
        </FadeInView>
      )}

      <FadeInView delay={220}>
        <Text style={styles.sectionLabel}>Features</Text>
        <View style={styles.featureGrid}>
          {featureItems.map(item => (
            <ScalePressable
              key={item.page}
              style={styles.featureTile}
              onPress={() => onNavigate(item.page)}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: `${item.color}14` }]}>
                <item.Icon size={30} color={item.color} strokeWidth={2.4} />
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
            </ScalePressable>
          ))}
        </View>
      </FadeInView>

      {ownedPokemon.length > 0 && (
        <FadeInView delay={360}>
          <Text style={styles.sectionLabel}>Recent Pokémon</Text>
          <Card style={styles.recentCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
              {[...ownedPokemon].reverse().slice(0, 6).map(owned => {
                const pokemon = getPokemonById(owned.pokemonDataId);
                if (!pokemon) return null;
                return (
                  <View key={owned.id} style={styles.recentItem}>
                    <FloatingSprite pokemon={pokemon} size={56} />
                    <Text style={styles.recentName}>{pokemon.name}</Text>
                    <LevelBadge level={owned.level} />
                  </View>
                );
              })}
            </ScrollView>
          </Card>
        </FadeInView>
      )}

      <Pressable onPress={onSwitchTrainer}>
        <Text style={styles.switchText}>Switch Trainer</Text>
      </Pressable>
    </ScrollView>
  );
}

function StarterScreen({
  hasStarter,
  starterId,
  onSelect,
}: {
  hasStarter: boolean;
  starterId?: string;
  onSelect: (pokemon: PokemonData) => void;
}) {
  const [step, setStep] = useState<'quiz' | 'pick' | 'confirm'>('quiz');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ Fire: 0, Grass: 0, Water: 0 });
  const [recommendedType, setRecommendedType] = useState('');
  const [recommendedId, setRecommendedId] = useState('');
  const [selected, setSelected] = useState<PokemonData | null>(null);

  if (hasStarter) {
    const current = starterId ? getPokemonById(starterId) : null;
    return (
      <InfoScreen
        icon="⭐"
        title="You already have a starter!"
        message={current ? `Your starter is ${current.name}.` : 'Your starter is already locked in.'}
      />
    );
  }

  function handleAnswer(type: string) {
    const nextScores = { ...scores, [type]: (scores[type] ?? 0) + 1 };
    setScores(nextScores);

    if (questionIndex < STARTER_QUESTIONS.length - 1) {
      setQuestionIndex(current => current + 1);
      return;
    }

    const maxScore = Math.max(...Object.values(nextScores));
    const topTypes = Object.entries(nextScores).filter(([, score]) => score === maxScore).map(([key]) => key);
    const typeWinner = topTypes[Math.floor(Math.random() * topTypes.length)];
    const starters = POKEMON_DATABASE.filter(pokemon => pokemon.isStarter && pokemon.type === typeWinner);
    const recommended = starters[Math.floor(Math.random() * starters.length)];
    setRecommendedType(typeWinner);
    setRecommendedId(recommended?.id ?? '');
    setStep('pick');
  }

  if (step === 'quiz') {
    const question = STARTER_QUESTIONS[questionIndex];
    const progress = questionIndex / STARTER_QUESTIONS.length;
    return (
      <ScrollView contentContainerStyle={styles.pageContent}>
        <View>
          <View style={styles.progressMeta}>
            <Text style={styles.smallMuted}>Question {questionIndex + 1} of {STARTER_QUESTIONS.length}</Text>
            <Text style={styles.smallMuted}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <FadeInView key={`q-${questionIndex}`}>
          <Card style={styles.questionCard}>
            <Text style={styles.muted}>Choose wisely, Trainer!</Text>
            <Text style={styles.questionText}>{question.text}</Text>
          </Card>
        </FadeInView>

        {question.options.map((option, index) => (
          <FadeInView key={option.label} delay={index * 90}>
            <ScalePressable style={styles.answerCard} onPress={() => handleAnswer(option.type)}>
              <Text style={styles.answerText}>{option.label}</Text>
            </ScalePressable>
          </FadeInView>
        ))}
      </ScrollView>
    );
  }

  if (step === 'pick') {
    const starters = POKEMON_DATABASE.filter(pokemon => pokemon.isStarter && pokemon.type === recommendedType);
    return (
      <ScrollView contentContainerStyle={styles.pageContent}>
        <Card style={styles.recommendationCard}>
          <Text style={styles.muted}>Based on your answers, you suit a</Text>
          <Text style={[styles.recommendedType, typeTextStyle(recommendedType)]}>{recommendedType}-type Trainer!</Text>
          <Text style={styles.smallMuted}>Pick one starter from any region</Text>
        </Card>

        {starters.map((pokemon, index) => (
          <FadeInView key={pokemon.id} delay={index * 90}>
            <ScalePressable
              style={styles.pickCard}
              onPress={() => {
                setSelected(pokemon);
                setStep('confirm');
              }}
            >
              <View style={styles.spriteFrame}>
                <FloatingSprite pokemon={pokemon} size={62} />
              </View>
              <View style={styles.flexOne}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardTitle}>{pokemon.name}</Text>
                  {pokemon.id === recommendedId ? <Text style={styles.recommendedBadge}>Recommended</Text> : null}
                </View>
                <View style={styles.badgeRow}>
                  <TypeBadge type={pokemon.type} />
                  <RegionBadge region={pokemon.region} />
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </ScalePressable>
          </FadeInView>
        ))}

        <Pressable
          onPress={() => {
            setQuestionIndex(0);
            setScores({ Fire: 0, Grass: 0, Water: 0 });
            setStep('quiz');
          }}
        >
          <Text style={styles.switchText}>Retake questionnaire</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!selected) return null;
  return (
    <ScrollView contentContainerStyle={[styles.pageContent, styles.confirmContent]}>
      <Text style={styles.muted}>Your chosen partner</Text>
      <PulseView style={styles.confirmSpriteFrame}>
        <PokemonSprite pokemon={selected} size={128} />
      </PulseView>
      <Text style={styles.confirmName}>{selected.name}</Text>
      <View style={styles.badgeRow}>
        <TypeBadge type={selected.type} />
        <RegionBadge region={selected.region} />
      </View>
      <Card style={styles.confirmNote}>
        <Text style={styles.confirmNoteText}>
          {selected.name} will start at Lv.5 and join your adventure. You can evolve it later using the correct stone!
        </Text>
      </Card>
      <Pressable style={styles.confirmButton} onPress={() => onSelect(selected)}>
        <Text style={styles.confirmButtonText}>Begin with {selected.name}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => setStep('pick')}>
        <Text style={styles.secondaryButtonText}>Choose another</Text>
      </Pressable>
    </ScrollView>
  );
}

function PokedexScreen({ ownedPokemon }: { ownedPokemon: OwnedPokemon[] }) {
  const [caughtPokemon, setCaughtPokemon] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        const ownedIds = Array.from(new Set(ownedPokemon.map(owned => owned.pokemonDataId)));
        
        const fetchedData = await Promise.all(
          ownedIds.map(async (idStr) => {
            const numId = parseInt(idStr, 10);
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${numId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            
            const typeName = data.types[0].type.name;
            const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
            const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            
            let region = 'Unknown';
            if (numId <= 151) region = 'Kanto';
            else if (numId <= 251) region = 'Johto';
            else if (numId <= 386) region = 'Hoenn';
            else if (numId <= 493) region = 'Sinnoh';
            else if (numId <= 649) region = 'Unova';
            else if (numId <= 721) region = 'Kalos';
            else if (numId <= 809) region = 'Alola';
            else if (numId <= 898) region = 'Galar';
            else region = 'Paldea';

            return {
              id: idStr,
              name: capitalizedName,
              type: capitalizedType,
              region: region,
              spriteId: numId,
              evolutionStage: 1,
            } as PokemonData;
          })
        );
        
        setCaughtPokemon(fetchedData);
      } catch (error) {
        console.error("Error fetching from PokeAPI", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPokemon();
  }, [ownedPokemon]);

  if (loading) {
    return (
      <View style={[styles.pageContent, { alignItems: 'center', paddingTop: 40 }]}>
        <Text style={styles.muted}>Loading Pokédex from PokeAPI...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={caughtPokemon}
      keyExtractor={pokemon => pokemon.id}
      contentContainerStyle={styles.pageContent}
      renderItem={({ item }) => (
        <PokemonListCard pokemon={item}>
          <Text style={styles.ownedText}>
            Owned
          </Text>
        </PokemonListCard>
      )}
    />
  );
}

function StoreScreen({
  coins,
  inventory,
  onBuy,
}: {
  coins: number;
  inventory: Record<string, number>;
  onBuy: (item: StoreItem) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Card style={styles.storeHeader}>
        <Text style={styles.sectionLabel}>Trainer Coins</Text>
        <CoinDisplay coins={coins} />
      </Card>
      {STORE_ITEMS.map(item => {
        const canBuy = coins >= item.price;
        return (
          <Card key={item.name} style={styles.itemCard}>
            <StoreItemIcon item={item} />
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.smallMuted}>{item.description}</Text>
              <Text style={styles.smallMuted}>Owned: {inventory[item.name] ?? 0}</Text>
            </View>
            <Pressable
              style={[styles.buyButton, !canBuy && styles.disabledButton]}
              disabled={!canBuy}
              onPress={() => onBuy(item)}
            >
              <Text style={styles.buyButtonText}>{item.price}</Text>
            </Pressable>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function InventoryScreen({
  inventory,
  ownedPokemon,
  onUseRareCandy,
}: {
  inventory: Record<string, number>;
  ownedPokemon: OwnedPokemon[];
  onUseRareCandy: (ownedId: string, pokemonName: string) => void;
}) {
  const items = STORE_ITEMS.filter(item => (inventory[item.name] ?? 0) > 0);
  if (!items.length) return <InfoScreen icon="🎒" title="Empty Bag" message="Buy items from the store to fill your inventory." />;

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      {items.map(item => (
        <Card key={item.name} style={styles.itemCard}>
          <StoreItemIcon item={item} />
          <View style={styles.flexOne}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.smallMuted}>Quantity: {inventory[item.name]}</Text>
            {item.name === 'Rare Candy' && ownedPokemon[0] ? (
              <Pressable
                style={styles.inlineButton}
                onPress={() => {
                  const pokemon = getPokemonById(ownedPokemon[0].pokemonDataId);
                  if (pokemon) onUseRareCandy(ownedPokemon[0].id, pokemon.name);
                }}
              >
                <Text style={styles.inlineButtonText}>Use on first Pokémon</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

function EvolutionScreen({
  inventory,
  ownedPokemon,
  onEvolve,
}: {
  inventory: Record<string, number>;
  ownedPokemon: OwnedPokemon[];
  onEvolve: (owned: OwnedPokemon, nextId: string, stone: string) => void;
}) {
  const candidates = ownedPokemon
    .map(owned => ({ owned, pokemon: getPokemonById(owned.pokemonDataId) }))
    .filter((entry): entry is { owned: OwnedPokemon; pokemon: PokemonData } => !!entry.pokemon?.evolvesTo);

  if (!candidates.length) return <InfoScreen icon="✨" title="No Evolutions" message="Choose or catch Pokémon that can evolve." />;

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      {candidates.map(({ owned, pokemon }) => {
        const next = pokemon.evolvesTo ? getPokemonById(pokemon.evolvesTo) : null;
        const stone = pokemon.requiredStone ?? '';
        const canEvolve = !!next && !!stone && (inventory[stone] ?? 0) > 0;
        return (
          <Card key={owned.id} style={styles.itemCard}>
            <PokemonSprite pokemon={pokemon} size={62} />
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>{pokemon.name}</Text>
              <Text style={styles.smallMuted}>
                Evolves to {next?.name ?? 'Unknown'} with {stone || 'an item'}
              </Text>
              <Text style={styles.smallMuted}>Owned {stone}: {inventory[stone] ?? 0}</Text>
            </View>
            <Pressable
              style={[styles.selectButton, !canEvolve && styles.disabledButton]}
              disabled={!canEvolve || !next}
              onPress={() => next && onEvolve(owned, next.id, stone)}
            >
              <Text style={styles.selectButtonText}>Evolve</Text>
            </Pressable>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function HistoryScreen({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return <InfoScreen icon="📜" title="No History" message="Your journey log will appear here." />;
  return (
    <FlatList
      data={history}
      keyExtractor={entry => entry.id}
      contentContainerStyle={styles.pageContent}
      renderItem={({ item }) => (
        <Card style={styles.historyCard}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.smallMuted}>{item.detail}</Text>
          <Text style={styles.timestamp}>{item.createdAt}</Text>
        </Card>
      )}
    />
  );
}

function InfoScreen({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

function PokemonListCard({ pokemon, children }: { pokemon: PokemonData; children?: React.ReactNode }) {
  const colors = getTypeColor(pokemon.type);
  return (
    <Card style={[styles.pokemonCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <PokemonSprite pokemon={pokemon} size={66} />
      <View style={styles.flexOne}>
        <Text style={styles.cardTitle}>{pokemon.name}</Text>
        <Text style={[styles.typeLine, { color: colors.text }]}>
          #{pokemon.id} · {pokemon.region}
        </Text>
        <TypeBadge type={pokemon.type} />
      </View>
      {children}
    </Card>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function BottomNav({ current, onNavigate }: { current: Page; onNavigate: (page: Page) => void }) {
  return (
    <View style={styles.bottomNav}>
      {navItems.map(item => {
        const active = current === item.page || (current === 'starter' && item.page === 'dashboard');
        return (
          <Pressable
            key={item.page}
            style={[styles.navItem, active && styles.activeNavItem]}
            onPress={() => onNavigate(item.page)}
          >
            <item.Icon size={24} color={active ? '#CC0000' : '#64748B'} strokeWidth={2.5} />
            <Text style={[styles.navLabel, active && styles.activeNavLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PokemonSprite({ pokemon, size }: { pokemon: PokemonData; size: number }) {
  return (
    <Image
      source={{ uri: getSpriteUrl(pokemon.spriteId) }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function FloatingSprite({ pokemon, size }: { pokemon: PokemonData; size: number }) {
  return (
    <FloatingView distance={8} duration={2600}>
      <PokemonSprite pokemon={pokemon} size={size} />
    </FloatingView>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors = getTypeColor(type);
  return (
    <View style={[styles.typeBadge, { backgroundColor: colors.badge }]}>
      <Text style={styles.typeBadgeText}>{type}</Text>
    </View>
  );
}

function RegionBadge({ region }: { region: string }) {
  const colors: Record<string, string> = {
    Kanto: '#CC0000',
    Unova: '#003A70',
    Paldea: '#7B2D8B',
  };
  return (
    <View style={[styles.typeBadge, { backgroundColor: colors[region] ?? '#555' }]}>
      <Text style={styles.typeBadgeText}>{region}</Text>
    </View>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <View style={styles.levelBadge}>
      <Text style={styles.levelBadgeText}>Lv.{level}</Text>
    </View>
  );
}

function CoinDisplay({ coins }: { coins: number }) {
  return (
    <View style={styles.coinDisplay}>
      <CircleDollarSign size={22} color="#B7791F" strokeWidth={2.5} />
      <Text style={styles.coinText}>{coins}</Text>
    </View>
  );
}

function StoreItemIcon({ item }: { item: StoreItem }) {
  const iconProps = { size: 30, strokeWidth: 2.4 };
  let icon = <Candy {...iconProps} color="#C05621" />;
  let backgroundColor = '#FFF7ED';

  if (item.name.includes('Fire')) {
    icon = <Flame {...iconProps} color="#FF6B35" />;
    backgroundColor = '#FFF0EB';
  } else if (item.name.includes('Water')) {
    icon = <Waves {...iconProps} color="#4A90E2" />;
    backgroundColor = '#EBF4FF';
  } else if (item.name.includes('Leaf')) {
    icon = <Leaf {...iconProps} color="#38A169" />;
    backgroundColor = '#F0FFF4';
  } else if (item.name.includes('Thunder')) {
    icon = <Zap {...iconProps} color="#D69E2E" />;
    backgroundColor = '#FFFFF0';
  }

  return <View style={[styles.itemIconBox, { backgroundColor }]}>{icon}</View>;
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function FadeInView({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function FloatingView({
  children,
  delay = 0,
  distance = 20,
  duration = 3000,
  reverse = false,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  reverse?: boolean;
  style?: any;
}) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, distance, duration, value]);

  const translateY = value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reverse ? distance : -distance],
  });

  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function FloatingText({
  children,
  delay,
  reverse,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  reverse?: boolean;
  style?: any;
}) {
  return (
    <FloatingView delay={delay} reverse={reverse} style={style}>
      <Text style={styles.floatText}>{children}</Text>
    </FloatingView>
  );
}

function SpinImage({ source, style }: { source: ImageSourcePropType; style?: any }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return <Animated.Image source={source} style={[style, { transform: [{ rotate }] }]} />;
}

function PulseView({ children, style }: { children: React.ReactNode; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scale]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

function PokeballTransition() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 35,
        duration: 1150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1150,
        delay: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ]).start();
  }, [opacity, rotation, scale]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Image
      source={pokeballImg}
      style={[styles.transitionBall, { opacity, transform: [{ scale }, { rotate }] }]}
    />
  );
}

function ScalePressable({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function typeTextStyle(type: string) {
  if (type === 'Fire') return { color: '#FF6B35' };
  if (type === 'Water') return { color: '#4A90E2' };
  return { color: '#38A169' };
}

function titleForPage(page: Page) {
  const titles: Record<Page, string> = {
    start: 'PokéJourney',
    dashboard: 'Dashboard',
    starter: 'Starter Selection',
    pokedex: 'Pokédex',
    store: 'Pokémon Store',
    inventory: 'Inventory',
    evolution: 'Evolution',
    history: 'Game History',
    facilitator: 'Facilitator Log',
    subsystem: 'Subsystem Receiver',
  };
  return titles[page];
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  phone: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#F8FAFC',
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    padding: 24,
    overflow: 'hidden',
    backgroundColor: '#CC0000',
  },
  floatIcon: {
    position: 'absolute',
  },
  floatText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 34,
  },
  floatOne: { top: 40, left: 24 },
  floatTwo: { top: 82, right: 34, fontSize: 42 },
  floatThree: { bottom: 150, left: 42 },
  floatFour: { bottom: 195, right: 34 },
  floatFive: { top: '32%', left: '25%', fontSize: 26 },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 210,
    height: 84,
  },
  bigBall: {
    width: 98,
    height: 98,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
  },
  startCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 22,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 30,
    elevation: 8,
  },
  transitionOverlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 99,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#CC0000',
},
  transitionBall: {
    width: 96,
    height: 96,
  },
  muted: {
    color: '#64748B',
    fontSize: 14,
  },
  startHeading: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '800',
  },
  inputLabel: {
    marginTop: 6,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#111827',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FC8181',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  startButton: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: '#CC0000',
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#CC0000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  pageContent: {
    gap: 14,
    padding: 16,
    paddingBottom: 92,
  },
  card: {
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  trainerCard: {
    overflow: 'hidden',
  },
  trainerHeader: {
    minHeight: 88,
    padding: 16,
    backgroundColor: '#CC0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trainerLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '800',
  },
  trainerName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },
  headerBall: {
    width: 52,
    height: 52,
  },
  statsRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statBlock: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: '#E5E7EB',
  },
  statSpacer: {
    flex: 1,
  },
  starterCard: {
    padding: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  starterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  spriteFrame: {
    borderWidth: 2,
    borderColor: '#FEB2B2',
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    padding: 8,
  },
  flexOne: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '900',
  },
  smallMuted: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  chooseStarterButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CC0000',
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    padding: 18,
    alignItems: 'center',
  },
  chooseStarterText: {
    color: '#CC0000',
    fontSize: 14,
    fontWeight: '900',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  featureTile: {
    width: '23%',
    aspectRatio: 1,
    minHeight: 78,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
  recentCard: {
    padding: 12,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    width: 66,
    alignItems: 'center',
    gap: 4,
  },
  recentName: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  header: {
    minHeight: 56,
    backgroundColor: '#CC0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 38,
    fontWeight: '400',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  pokemonCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeLine: {
    fontSize: 12,
    fontWeight: '800',
  },
  selectButton: {
    borderRadius: 12,
    backgroundColor: '#CC0000',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedButton: {
    backgroundColor: '#805AD5',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  ownedText: {
    color: '#276749',
    fontSize: 12,
    fontWeight: '900',
  },
  unownedText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  storeHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcon: {
    fontSize: 30,
  },
  itemIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    minWidth: 58,
    borderRadius: 12,
    backgroundColor: '#276749',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: '#FFDE00',
    fontSize: 12,
    fontWeight: '900',
  },
  historyCard: {
    padding: 15,
    gap: 5,
  },
  timestamp: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyMessage: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CC0000',
  },
  questionCard: {
    padding: 20,
    gap: 8,
  },
  questionText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '900',
  },
  answerCard: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 1,
  },
  answerText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  recommendationCard: {
    alignItems: 'center',
    padding: 18,
    gap: 6,
  },
  recommendedType: {
    fontSize: 20,
    fontWeight: '900',
  },
  pickCard: {
    borderWidth: 2,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  recommendedBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    color: '#A16207',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '900',
  },
  chevron: {
    color: '#CC0000',
    fontSize: 30,
    fontWeight: '300',
  },
  confirmContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  confirmSpriteFrame: {
    width: 164,
    height: 164,
    borderRadius: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  confirmName: {
    color: '#1F2937',
    fontSize: 30,
    fontWeight: '900',
  },
  confirmNote: {
    padding: 16,
    maxWidth: 330,
  },
  confirmNoteText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 14,
    backgroundColor: '#CC0000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    padding: 8,
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
  levelBadge: {
    borderRadius: 999,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelBadgeText: {
    color: '#FFDE00',
    fontSize: 11,
    fontWeight: '900',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 17,
  },
  coinText: {
    color: '#B7791F',
    fontSize: 16,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 16,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeNavItem: {
    backgroundColor: '#FFF5F5',
  },
  navLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  activeNavLabel: {
    color: '#CC0000',
  },
});
