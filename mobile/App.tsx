import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ExpensesProvider } from './src/context/ExpensesContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { AuthStack } from './src/navigation/AuthStack';
import { MainTabs } from './src/navigation/MainTabs';
import Logger from './src/logging/Logger';

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { colors } = useTheme();
  async function tryUnlock() {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Expense Tracker' });
    if (result.success) onUnlock();
  }
  useEffect(() => { tryUnlock(); }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 16 }}>
      <Text style={{ fontSize: 40 }}>🔒</Text>
      <Text style={{ color: colors.text, fontWeight: '700' }}>App locked</Text>
      <Pressable onPress={tryUnlock} style={{ backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 }}>
        <Text style={{ color: colors.textOnAccent, fontWeight: '700' }}>Unlock</Text>
      </Pressable>
    </View>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const { user, isLoading } = useAuth();
  const { biometricLockEnabled, loaded } = useSettings();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => { Logger.initialize().then(() => Logger.logAppStart()); }, []);

  if (isLoading || !loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (user && biometricLockEnabled && !unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <ExpensesProvider>
          <MainTabs />
        </ExpensesProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <RootNavigator />
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}