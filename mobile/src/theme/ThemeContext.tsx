import { createContext, useContext, useEffect, useMemo, useState, ReactNode, Children } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors } from './lightColors';
import { darkColors } from './darkColors';
import { colors } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextValue = {
    colors: typeof lightColors;
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "expense-tracker:theme-mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system'); //By Default 'System' Theme 

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                setModeState(saved);
            }
        });
    }, []);

    function setMode(next: ThemeMode) {
        setModeState(next);
        AsyncStorage.setItem(STORAGE_KEY, next);
    }

    const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    const activeColors = isDark ? darkColors : lightColors;

    const value = useMemo(() =>
        ({ colors: activeColors, mode, isDark, setMode }), [activeColors, mode, isDark]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}