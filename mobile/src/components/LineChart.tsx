import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme';

type Point = { label: string; value: number };
type Props = { data: Point[]; height?: number; color?: string };

export function LineChart({ data, height = 140, color }: Props) {
    const { colors } = useTheme();
    const lineColor = color ?? colors.accent;
    const width = 300;
    const paddingX = 10;
    const paddingY = 16;

    if (data.length === 0) {
        return (
            <View style={[styles.empty, { height }]}>
                <Text style={{ color: colors.textMuted, fontSize: typography.fontSizes.sm }}>No data yet</Text>
            </View>
        );
    }

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const stepX = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
        x: paddingX + i * stepX,
        y: paddingY + (1 - d.value / maxValue) * (height - paddingY * 2),
        label: d.label,
    }));

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const labelStep = Math.max(1, Math.ceil(points.length / 6));

    return (
        <View>
            <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                <SvgLine x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth={1} />
                <Polyline points={polylinePoints} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={lineColor} />
                ))}
            </Svg>
            <View style={styles.labelRow}>
                {points.map((p, i) =>
                    i % labelStep === 0 || i === points.length - 1 ? (
                        <Text key={i} style={[styles.label, { color: colors.textSecondary }]}>{p.label}</Text>
                    ) : null
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    empty: { alignItems: 'center', justifyContent: 'center' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 6 },
    label: { fontSize: 10, fontWeight: '600' },
});