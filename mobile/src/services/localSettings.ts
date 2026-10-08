import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_KEY = 'expense-tracker:currency-symbol';
const BIOMETRIC_KEY = 'expense-tracker:biometric-lock-enabled';

export async function getCurrencySymbol(): Promise<string> {
  return (await AsyncStorage.getItem(CURRENCY_KEY)) ?? 'Rs.';
}
export async function setCurrencySymbol(symbol: string): Promise<void> {
  await AsyncStorage.setItem(CURRENCY_KEY, symbol);
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(BIOMETRIC_KEY)) === 'true';
}
export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}