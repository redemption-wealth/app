const TILE_COLORS = [
  "#8ee6c8",
  "#fdcfd9",
  "#a7f3d0",
  "#f9ffc4",
  "#c4b5fd",
  "#fde68a",
  "#bae6fd",
  "#fecaca",
];

interface CategoryTileProps {
  name: string;
  size?: number;
}

export function CategoryTile({ name, size = 56 }: CategoryTileProps) {
  const colorIndex =
    name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) %
    TILE_COLORS.length;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
      style={{
        width: size,
        height: size,
        backgroundColor: TILE_COLORS[colorIndex],
      }}
    >
      <span
        className="font-display text-[#1e293b]"
        style={{ fontSize: size * 0.45, fontWeight: 800 }}
      >
        {initial}
      </span>
    </div>
  );
}
