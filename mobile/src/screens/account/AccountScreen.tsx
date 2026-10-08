import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpensesContext';
import { useSettings } from '../../context/SettingsContext';
import { createCategory, deleteCategory as apiDeleteCategory } from '../../services/expenses';
import { mapApiCategory } from '../../services/mappers';
import { spacing, borderRadius, typography } from '../../theme';

const CURRENCY_OPTIONS = ['Rs.', '$', '€', '£', '¥'];

export function AccountScreen() {
    const { colors, mode, setMode, isDark } = useTheme();
    const { user, signOut } = useAuth();
    const { categories, expenses, refresh } = useExpenses();
    const { currencySymbol, biometricLockEnabled, setCurrencySymbol, setBiometricLockEnabled } = useSettings();
    const styles = getStyles(colors);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [savingCat, setSavingCat] = useState(false);

    const initials = (user?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    async function handleAddCategory() {
        const trimmed = newCatName.trim();
        if (!trimmed) {
            Alert.alert('Missing name', 'Enter a category name.');
            return;
        }
        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert('Duplicate', `"${trimmed}" already exists.`);
            return;
        }
        setSavingCat(true);
        try {
            await createCategory({ name: trimmed });
            await refresh();
            setNewCatName('');
            setAddModalOpen(false);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not add category.');
        } finally {
            setSavingCat(false);
        }
    }

    function handleDeleteCategory(category: (typeof categories)[number]) {
        if (category.isDefault) {
            Alert.alert('Cannot delete', 'This is a default category and cannot be deleted.');
            return;
        }
        const hasExpenses = expenses.some((e) => e.categoryId === category.id);
        const otherCategory = categories.find((c) => c.name.toLowerCase() === 'other');

        if (hasExpenses) {
            const count = expenses.filter((e) => e.categoryId === category.id).length;
            Alert.alert(
                'Category has expenses',
                `This category has ${count} expense(s). Delete anyway? They'll be moved to "Other".`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete', style: 'destructive',
                        onPress: async () => {
                            try {
                                await apiDeleteCategory(category.id, otherCategory?.id);
                                await refresh();
                            } catch (err: any) {
                                Alert.alert('Error', 'Could not delete category.');
                            }
                        },
                    },
                ]
            );
        } else {
            Alert.alert('Delete category', `Delete "${category.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiDeleteCategory(category.id);
                            await refresh();
                        } catch (err: any) {
                            Alert.alert('Error', 'Could not delete category.');
                        }
                    },
                },
            ]);
        }
    }

    async function handleToggleBiometric(value: boolean) {
        if (value) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!hasHardware || !isEnrolled) {
                Alert.alert('Not available', 'No biometric method is set up on this device.');
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to enable biometric lock' });
            if (!result.success) return;
        }
        await setBiometricLockEnabled(value);
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
            <Text style={styles.heading}>Account</Text>
            <Text style={styles.sub}>Profile, categories & preferences</Text>

            <View style={styles.profileHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                <View>
                    <Text style={styles.profileName}>{user?.name}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>
            </View>

            <Text style={styles.sectionLabel}>Preferences</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>🌙 Dark mode</Text>
                    <Pressable
                        style={[styles.toggle, isDark && styles.toggleOn]}
                        onPress={() => setMode(isDark ? 'light' : 'dark')}
                    >
                        <View style={[styles.toggleDot, isDark && styles.toggleDotOn]} />
                    </Pressable>
                </View>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>🔒 Biometric lock</Text>
                    <Pressable
                        style={[styles.toggle, biometricLockEnabled && styles.toggleOn]}
                        onPress={() => handleToggleBiometric(!biometricLockEnabled)}
                    >
                        <View style={[styles.toggleDot, biometricLockEnabled && styles.toggleDotOn]} />
                    </Pressable>
                </View>
                <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => setCurrencyModalOpen(true)}>
                    <Text style={styles.rowLabel}>💱 Currency</Text>
                    <Text style={styles.rowValue}>{currencySymbol} ›</Text>
                </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Manage Categories</Text>
            <View style={styles.card}>
                {categories.map((c) => (
                    <View key={c.id} style={styles.catRow}>
                        <View style={[styles.catIcon, { backgroundColor: c.tint }]}><Text style={{ fontSize: 16 }}>{c.emoji}</Text></View>
                        <Text style={styles.catName}>{c.name}</Text>
                        {c.isDefault && <Text style={styles.catBadge}>Default</Text>}
                        <Pressable onPress={() => handleDeleteCategory(c)} disabled={c.isDefault} hitSlop={8}>
                            <Text style={{ fontSize: 16, opacity: c.isDefault ? 0.3 : 1 }}>🗑️</Text>
                        </Pressable>
                    </View>
                ))}
                <Pressable style={styles.addCatBtn} onPress={() => setAddModalOpen(true)}>
                    <Text style={styles.addCatBtnText}>+ Add category</Text>
                </Pressable>
            </View>

            <View style={{ height: spacing.lg }} />
            <View style={styles.card}>
                <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => signOut()}>
                    <Text style={[styles.rowLabel, { color: colors.danger }]}>🚪 Log out</Text>
                </Pressable>
            </View>

            {/* Add Category Modal */}
            <Modal visible={addModalOpen} animationType="slide" transparent onRequestClose={() => setAddModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Add Category</Text>
                        <Text style={styles.modalLabel}>Name</Text>
                        <TextInput
                            value={newCatName} onChangeText={setNewCatName}
                            placeholder="e.g., Rent, Gym, Subscriptions"
                            placeholderTextColor={colors.textMuted}
                            style={styles.modalInput} maxLength={20} autoFocus
                        />
                        <Text style={styles.modalHint}>Icon and color are assigned automatically based on the name.</Text>
                        <Pressable style={[styles.modalSave, savingCat && { opacity: 0.6 }]} onPress={handleAddCategory} disabled={savingCat}>
                            {savingCat ? <ActivityIndicator color={colors.textOnAccent} /> : <Text style={styles.modalSaveText}>Add Category</Text>}
                        </Pressable>
                        <Pressable style={{ alignItems: 'center', marginTop: spacing.md }} onPress={() => setAddModalOpen(false)}>
                            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Currency Modal */}
            <Modal visible={currencyModalOpen} animationType="fade" transparent onRequestClose={() => setCurrencyModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Currency</Text>
                        {CURRENCY_OPTIONS.map((opt) => (
                            <Pressable
                                key={opt}
                                style={[styles.currencyOption, currencySymbol === opt && { borderColor: colors.accent }]}
                                onPress={() => { setCurrencySymbol(opt); setCurrencyModalOpen(false); }}
                            >
                                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '700' }}>{opt}</Text>
                            </Pressable>
                        ))}
                        <Pressable style={{ alignItems: 'center', marginTop: spacing.md }} onPress={() => setCurrencyModalOpen(false)}>
                            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function getStyles(colors: any) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
        heading: { fontSize: typography.fontSizes.xxxl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
        sub: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, marginTop: 2, marginBottom: spacing.lg },
        profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
        avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
        avatarText: { color: colors.textOnAccent, fontWeight: '800', fontSize: 18 },
        profileName: { fontWeight: '800', fontSize: 17, color: colors.text },
        profileEmail: { fontSize: 12.5, color: colors.textSecondary },
        sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.sm },
        card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
        rowLabel: { fontSize: 14.5, color: colors.text, fontWeight: '600' },
        rowValue: { color: colors.textSecondary, fontSize: 13 },
        toggle: { width: 42, height: 25, borderRadius: 13, backgroundColor: colors.border, justifyContent: 'center' },
        toggleOn: { backgroundColor: colors.accent },
        toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: 3 },
        toggleDotOn: { marginLeft: 19 },
        catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
        catIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
        catName: { flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '600' },
        catBadge: { fontSize: 10, color: colors.textMuted, fontWeight: '700', marginRight: 8 },
        addCatBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, borderRadius: borderRadius.md, alignItems: 'center', paddingVertical: 10, marginTop: 6 },
        addCatBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
        modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
        modalCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl },
        modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
        modalLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textTransform: 'uppercase', marginBottom: 6 },
        modalInput: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text },
        modalHint: { fontSize: 11.5, color: colors.textMuted, marginTop: 8, marginBottom: spacing.md },
        modalSave: { backgroundColor: colors.accent, borderRadius: borderRadius.md, alignItems: 'center', paddingVertical: 12 },
        modalSaveText: { color: colors.textOnAccent, fontWeight: '800' },
        currencyOption: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: 12, marginBottom: 8, alignItems: 'center' },
    });
}