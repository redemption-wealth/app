"use client";

interface CategoryFilterTabsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

export function CategoryFilterTabs({
  categories,
  active,
  onSelect,
}: CategoryFilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "border border-[#ececec] bg-white text-[#525252] hover:bg-[#f5f5f4]"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
