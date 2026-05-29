# PokeJourney

Workspace layout:

```text
pokejourney/
├── main-system/          # Mobile React Native / Expo Pokédex app
├── catching-subsystem/   # Web React subsystem 1 mini games
├── leveling-subsystem/   # Web React subsystem 2 mini games
├── shared/               # Shared constants, Pokémon data, result format
└── docs/                 # Guidelines, database schema, API format, context
```

## Run

```bash
corepack pnpm install
npm run dev:main
npm run dev:catching
npm run dev:leveling
```

## Build Web Subsystems

```bash
pnpm build
```
