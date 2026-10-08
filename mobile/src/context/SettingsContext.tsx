import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    getCurrencySymbol, setCurrencySymbol as persistCurrency,
    getBiometricLockEnabled, setBiometricLockEnabled as persistBiometric,
} from '../services/localSettings';

type SettingsContextValue = {
    currencySymbol: string;
    biometricLockEnabled: boolean;
    setCurrencySymbol: (symbol: string) => Promise<void>;
    setBiometricLockEnabled: (enabled: boolean) => Promise<void>;
    loaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [currencySymbol, setCurrencySymbolState] = useState('Rs.');
    const [biometricLockEnabled, setBiometricLockEnabledState] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            setCurrencySymbolState(await getCurrencySymbol());
            setBiometricLockEnabledState(await getBiometricLockEnabled());
            setLoaded(true);
        })();
    }, []);

    async function setCurrencySymbol(symbol: string) {
        setCurrencySymbolState(symbol);
        await persistCurrency(symbol);
    }

    async function setBiometricLockEnabled(enabled: boolean) {
        setBiometricLockEnabledState(enabled);
        await persistBiometric(enabled);
    }

    return (
        <SettingsContext.Provider value={{ currencySymbol, biometricLockEnabled, setCurrencySymbol, setBiometricLockEnabled, loaded }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}