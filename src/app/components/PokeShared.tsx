import { getSpriteUrl, getTypeColor, REGION_COLORS } from '../data/pokemonData';
import pokeballImg from '../../imports/image-2.png';

export function PokemonSprite({ spriteId, name, size = 80 }: { spriteId: number; name: string; size?: number }) {
  return (
    <img
      src={getSpriteUrl(spriteId)}
      alt={name}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="%23eee" stroke="%23ccc"/><text x="50%" y="55%" text-anchor="middle" fill="%23999" font-size="10">?</text></svg>`;
      }}
    />
  );
}

export function TypeBadge({ type }: { type: string }) {
  const color = getTypeColor(type);
  return (
    <span
      style={{ backgroundColor: color.badge, color: '#fff' }}
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
    >
      {type}
    </span>
  );
}

export function RegionBadge({ region }: { region: string }) {
  const color = REGION_COLORS[region] ?? '#555';
  return (
    <span
      style={{ backgroundColor: color, color: '#fff' }}
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
    >
      {region}
    </span>
  );
}

export function CoinDisplay({ coins }: { coins: number }) {
  return (
    <span className="flex items-center gap-1 font-semibold" style={{ color: '#B7791F' }}>
      <span className="text-base">🪙</span>
      <span>{coins}</span>
    </span>
  );
}

export function LevelBadge({ level }: { level: number }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#1a1a2e', color: '#FFDE00' }}>
      Lv.{level}
    </span>
  );
}

export function PokeHeader({
  title,
  onBack,
  rightContent,
}: {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center px-4 py-3 gap-3 shadow-md"
      style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF4444 100%)' }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="text-white p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-white font-bold tracking-wide" style={{ fontSize: '1rem' }}>{title}</h1>
      {rightContent}
    </div>
  );
}

export function PokeCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100  hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <p className="text-sm text-center max-w-48">{message}</p>
    </div>
  );
}

export function PokeBall({ size = 32 }: { size?: number }) {
  return (
    <img
      src={pokeballImg}
      alt="Pokeball"
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}

export function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    Starter: '#805AD5',
    PokeReflex: '#2B6CB0',
    PokeGuess: '#276749',
    'IRL Catch': '#C05621',
    'Manual Log': '#718096',
  };
  return (
    <span
      style={{ backgroundColor: colors[source] ?? '#718096', color: '#fff' }}
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
    >
      {source}
    </span>
  );
}
