import type { Category } from '../types';

type Props = { categories: Category[]; value: string; onChange: (id: string) => void };

export function CategoryChips({ categories, value, onChange }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
                const selected = c.id === value;
                return (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => onChange(c.id)}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
                        style={selected ? { backgroundColor: c.tint, borderColor: c.color, color: c.color } : { borderColor: '#E2E8F0', color: '#64748B' }}
                    >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                    </button>
                );
            })}
        </div>
    );
}