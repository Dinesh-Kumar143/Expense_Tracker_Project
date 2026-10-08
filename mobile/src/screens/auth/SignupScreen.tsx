import { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { spacing, borderRadius, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export function SignupScreen() {
    const navigation = useNavigation<Nav>();
    const { colors } = useTheme();
    const { signUp } = useAuth();
    const styles = getStyles(colors);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSignup() {
        if (!name.trim() || !email.trim() || !password) {
            Alert.alert('Missing info', 'Fill in all fields to continue.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Weak password', 'Password must be at least 8 characters.');
            return;
        }
        setSubmitting(true);
        try {
            await signUp(name.trim(), email.trim().toLowerCase(), password);
        } catch (err: any) {
            const message = err?.response?.data?.error ?? 'Could not sign up. Try again.';
            Alert.alert('Signup failed', message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.content}>
                <Text style={styles.kicker}>Expense Tracker</Text>
                <Text style={styles.heading}>Create your account</Text>

                <View style={{ height: spacing.xl }} />
                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Dinesh Kumar" placeholderTextColor={colors.textMuted} style={styles.input} />

                <View style={{ height: spacing.lg }} />
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

                <View style={{ height: spacing.lg }} />
                <Text style={styles.label}>Password</Text>
                <TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.textMuted} secureTextEntry style={styles.input} />

                <Pressable style={[styles.primaryButton, submitting && styles.disabled]} onPress={handleSignup} disabled={submitting}>
                    {submitting ? <ActivityIndicator color={colors.textOnAccent} /> : <Text style={styles.primaryButtonText}>Sign up</Text>}
                </Pressable>

                <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Already have an account? <Text style={styles.linkAccent}>Log in</Text></Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

function getStyles(colors: any) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
        kicker: { color: colors.primary, fontWeight: typography.fontWeights.extrabold, fontSize: typography.fontSizes.sm, letterSpacing: 0.5, textTransform: 'uppercase' },
        heading: { marginTop: 4, fontSize: typography.fontSizes.xxxl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
        label: { marginBottom: spacing.sm, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.sm, color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
        input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, fontSize: typography.fontSizes.md, color: colors.text, fontWeight: typography.fontWeights.medium },
        primaryButton: { marginTop: spacing.xl, backgroundColor: colors.accent, borderRadius: borderRadius.lg, alignItems: 'center', paddingVertical: spacing.lg },
        disabled: { opacity: 0.6 },
        primaryButtonText: { color: colors.textOnAccent, fontWeight: typography.fontWeights.extrabold, fontSize: typography.fontSizes.md },
        linkRow: { marginTop: spacing.lg, alignItems: 'center' },
        linkText: { color: colors.textSecondary, fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.medium },
        linkAccent: { color: colors.accent, fontWeight: typography.fontWeights.bold },
    });
}
