import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { HomeScreen } from '../screens/home/HomeScreen';
import { InsightsScreen } from '../screens/insights/InsightsScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { AccountScreen } from '../screens/account/AccountScreen';


export type MainTabParamList = {
    Home: undefined;
    Insights: undefined;
    Reports: undefined;
    Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();



export function MainTabs() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
            <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }} />
            <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🧾</Text> }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});