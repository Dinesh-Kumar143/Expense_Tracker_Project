type Point = { label: string; value: number };
type Props = { data: Point[]; height?: number; color?: string };

export function LineChart({ data, height = 140, color = '#10B981' }: Props) {
    const width = 600;
    const paddingX = 10;
    const paddingY = 16;

    if (data.length === 0) {
        return <div style={{ height }} className="flex items-center justify-center text-sm text-slate-400">No data yet</div>;
    }

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const stepX = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
        x: paddingX + i * stepX,
        y: paddingY + (1 - d.value / maxValue) * (height - paddingY * 2),
        label: d.label,
    }));

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const labelStep = Math.max(1, Math.ceil(points.length / 8));

    return (
        <div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#E2E8F0" strokeWidth={1} />
                <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
                ))}
            </svg>
            <div className="mt-1 flex justify-between px-1.5">
                {points.map((p, i) =>
                    i % labelStep === 0 || i === points.length - 1 ? (
                        <span key={i} className="text-[10px] font-semibold text-slate-500">{p.label}</span>
                    ) : null
                )}
            </div>
        </div>
    );
}