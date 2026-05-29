import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  POKEMON_DATABASE,
  PokemonData,
  STORE_ITEMS,
  getSpriteUrl,
  getTypeColor,
} from '../shared/data/pokemonData';

type Screen = 'home' | 'pokedex' | 'starter' | 'bag';

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [activePlayer, setActivePlayer] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [starterId, setStarterId] = useState<string | null>(null);
  const [coins, setCoins] = useState(75);
  const [bag, setBag] = useState<Record<string, number>>({});

  const starter = useMemo(
    () => POKEMON_DATABASE.find(pokemon => pokemon.id === starterId),
    [starterId],
  );

  function startJourney() {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    setActivePlayer(trimmed);
  }

  function chooseStarter(pokemon: PokemonData) {
    setStarterId(pokemon.id);
    setScreen('home');
  }

  function buyItem(name: string, price: number) {
    if (coins < price) return;
    setCoins(current => current - price);
    setBag(current => ({ ...current, [name]: (current[name] ?? 0) + 1 }));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.phone}>
        <View style={styles.header}>
          <Text style={styles.kicker}>PokeJourney Main System</Text>
          <Text style={styles.title}>Pokédex App</Text>
        </View>

        {!activePlayer ? (
          <View style={styles.startPanel}>
            <Text style={styles.label}>Trainer name</Text>
            <TextInput
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Ash"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <Pressable style={styles.primaryButton} onPress={startJourney}>
              <Text style={styles.primaryButtonText}>Start Journey</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {screen === 'home' && (
              <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                  <View>
                    <Text style={styles.muted}>Welcome back</Text>
                    <Text style={styles.trainerName}>{activePlayer}</Text>
                    <Text style={styles.coins}>{coins} coins</Text>
                  </View>
                  {starter ? (
                    <Image source={{ uri: getSpriteUrl(starter.spriteId) }} style={styles.heroSprite} />
                  ) : (
                    <View style={styles.emptySprite}>
                      <Text style={styles.emptySpriteText}>?</Text>
                    </View>
                  )}
                </View>

                <View style={styles.grid}>
                  <ActionTile label="Choose Starter" onPress={() => setScreen('starter')} />
                  <ActionTile label="Open Pokédex" onPress={() => setScreen('pokedex')} />
                  <ActionTile label="Item Bag" onPress={() => setScreen('bag')} />
                </View>
              </ScrollView>
            )}

            {screen === 'starter' && (
              <FlatList
                contentContainerStyle={styles.content}
                data={POKEMON_DATABASE.filter(pokemon => pokemon.isStarter)}
                keyExtractor={pokemon => pokemon.id}
                renderItem={({ item }) => (
                  <PokemonRow pokemon={item} action="Select" onPress={() => chooseStarter(item)} />
                )}
              />
            )}

            {screen === 'pokedex' && (
              <FlatList
                contentContainerStyle={styles.content}
                data={POKEMON_DATABASE}
                keyExtractor={pokemon => pokemon.id}
                renderItem={({ item }) => <PokemonRow pokemon={item} />}
              />
            )}

            {screen === 'bag' && (
              <ScrollView contentContainerStyle={styles.content}>
                {STORE_ITEMS.map(item => (
                  <View key={item.name} style={styles.itemRow}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.muted}>{item.description}</Text>
                      <Text style={styles.muted}>Owned: {bag[item.name] ?? 0}</Text>
                    </View>
                    <Pressable style={styles.buyButton} onPress={() => buyItem(item.name, item.price)}>
                      <Text style={styles.buyButtonText}>{item.price}</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.tabs}>
              <Tab label="Home" active={screen === 'home'} onPress={() => setScreen('home')} />
              <Tab label="Dex" active={screen === 'pokedex'} onPress={() => setScreen('pokedex')} />
              <Tab label="Starter" active={screen === 'starter'} onPress={() => setScreen('starter')} />
              <Tab label="Bag" active={screen === 'bag'} onPress={() => setScreen('bag')} />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function ActionTile({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Text style={styles.tileText}>{label}</Text>
    </Pressable>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
    </Pressable>
  );
}

function PokemonRow({
  pokemon,
  action,
  onPress,
}: {
  pokemon: PokemonData;
  action?: string;
  onPress?: () => void;
}) {
  const colors = getTypeColor(pokemon.type);
  return (
    <View style={[styles.pokemonRow, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <Image source={{ uri: getSpriteUrl(pokemon.spriteId) }} style={styles.sprite} />
      <View style={styles.pokemonCopy}>
        <Text style={styles.pokemonName}>{pokemon.name}</Text>
        <Text style={[styles.typeText, { color: colors.text }]}>
          #{pokemon.id} · {pokemon.type} · {pokemon.region}
        </Text>
      </View>
      {action && onPress ? (
        <Pressable style={styles.rowButton} onPress={onPress}>
          <Text style={styles.rowButtonText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  phone: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#ef4444',
  },
  kicker: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  startPanel: {
    gap: 12,
    padding: 20,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
    padding: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 92,
  },
  heroCard: {
    minHeight: 150,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  muted: {
    color: '#64748b',
    fontSize: 13,
  },
  trainerName: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
  },
  coins: {
    marginTop: 8,
    color: '#b45309',
    fontSize: 16,
    fontWeight: '800',
  },
  heroSprite: {
    width: 112,
    height: 112,
  },
  emptySprite: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySpriteText: {
    color: '#64748b',
    fontSize: 36,
    fontWeight: '900',
  },
  grid: {
    gap: 10,
  },
  tile: {
    borderRadius: 8,
    backgroundColor: '#0f172a',
    padding: 18,
  },
  tileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  pokemonRow: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sprite: {
    width: 62,
    height: 62,
  },
  pokemonCopy: {
    flex: 1,
  },
  pokemonName: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
  },
  typeText: {
    fontWeight: '700',
  },
  rowButton: {
    borderRadius: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rowButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  itemRow: {
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcon: {
    fontSize: 28,
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  buyButton: {
    minWidth: 56,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#16a34a',
    padding: 10,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  tabs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: '#fee2e2',
  },
  tabText: {
    color: '#64748b',
    fontWeight: '800',
  },
  activeTabText: {
    color: '#dc2626',
  },
});
